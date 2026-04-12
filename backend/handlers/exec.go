package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"k8s.io/client-go/tools/remotecommand"

	"k-view/k8s"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		host := r.Host

		if origin == "" {
			return true // Not a cross-origin request
		}

		// Allow same origin
		if host != "" && strings.Contains(origin, host) {
			return true
		}

		// Check allowed origins from env
		allowedOrigins := os.Getenv("KVIEW_ALLOWED_ORIGINS")
		if allowedOrigins != "" {
			origins := strings.Split(allowedOrigins, ",")
			for _, o := range origins {
				if strings.TrimSpace(o) == origin {
					return true
				}
			}
		}

		log.Printf("WebSocket Origin Denied: %s (Host: %s)", origin, host)

		// In DEV_MODE we might want to be more lenient, but security first.
		if os.Getenv("DEV_MODE") == "true" {
			return true
		}

		return false
	},
}

// ExecHandler handles the websocket connections for the terminal
type ExecHandler struct {
	k8sClient k8s.KubernetesProvider
}

// NewExecHandler creates a new handler
func NewExecHandler(client k8s.KubernetesProvider) *ExecHandler {
	return &ExecHandler{k8sClient: client}
}

// TerminalMessage is the JSON structure sent from the JS xterm instance for resizing
type TerminalMessage struct {
	Op   string `json:"Op"`
	Data string `json:"Data"`
	Cols uint16 `json:"Cols"`
	Rows uint16 `json:"Rows"`
}

// wsPtyHandler implements the k8s.PtyHandler interface
type wsPtyHandler struct {
	conn      *websocket.Conn
	sizeChan  chan remotecommand.TerminalSize
	doneChan  chan struct{}
}

func (t *wsPtyHandler) Read(p []byte) (int, error) {
	_, msg, err := t.conn.ReadMessage()
	if err != nil {
		// Handle normal websocket closure gracefully by returning io.EOF
		if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
			return 0, io.EOF
		}
		return 0, err
	}

	var xtermMsg TerminalMessage
	if err := json.Unmarshal(msg, &xtermMsg); err == nil {
		if xtermMsg.Op == "resize" {
			t.sizeChan <- remotecommand.TerminalSize{Width: xtermMsg.Cols, Height: xtermMsg.Rows}
			return 0, nil
		}
		if xtermMsg.Op == "stdin" {
			return copyBytes(p, []byte(xtermMsg.Data)), nil
		}
	}

	// Fallback to raw bytes if not JSON
	return copyBytes(p, msg), nil
}

func copyBytes(dst, src []byte) int {
	n := copy(dst, src)
	return n
}

func (t *wsPtyHandler) Write(p []byte) (int, error) {
	err := t.conn.WriteMessage(websocket.BinaryMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func (t *wsPtyHandler) Next() *remotecommand.TerminalSize {
	select {
	case size := <-t.sizeChan:
		return &size
	case <-t.doneChan:
		return nil
	}
}

func (t *wsPtyHandler) Done() {
	close(t.doneChan)
}

// HandleExec upgrades the connection and starts the PTY session
// @Summary Pod Terminal (WebSocket)
// @Description Upgrade connection to WebSocket for interactive pod terminal access
// @Tags Workloads
// @Param namespace path string true "Namespace"
// @Param name path string true "Pod Name"
// @Param container path string true "Container Name"
// @Param shell query string false "Shell to use (sh, bash)" default(sh)
// @Success 101
// @Security BearerAuth
// @Router /api/exec/{namespace}/{name}/{container} [get]
func (h *ExecHandler) HandleExec(c *gin.Context) {
	namespace := c.Param("namespace")
	pod := c.Param("name")
	container := c.Param("container")
	shell := c.Query("shell")

	if namespace == "" || pod == "" || container == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "namespace, pod, and container are required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Terminal Upgrade Error: %v", err)
		return
	}
	defer conn.Close()

	pty := &wsPtyHandler{
		conn:     conn,
		sizeChan: make(chan remotecommand.TerminalSize),
		doneChan: make(chan struct{}),
	}

	// We pass the gin request context which has the 'user' injected by auth middleware
	err = h.k8sClient.Exec(c.Request.Context(), namespace, pod, container, shell, pty)
	if err != nil {
		// Check if the error is just a websocket closure or EOF
		if !websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) && err != io.EOF {
			log.Printf("Exec error on %s/%s/%s: %v", namespace, pod, container, err)
			_ = conn.WriteMessage(websocket.TextMessage, []byte("\r\n\033[31mTerminal Disconnected: "+err.Error()+"\033[0m\r\n"))
		}
	} else {
		// Graceful close for normal termination
		_ = conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	}
}
