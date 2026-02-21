package k8s

import (
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/tools/remotecommand"
)

// PtyHandler is what remotecommand expects from a terminal
type PtyHandler interface {
	io.Reader
	io.Writer
	remotecommand.TerminalSizeQueue
	Done()
}

// Exec opens a shell in a pod container and connects it to the pty
func (c *Client) Exec(ctx context.Context, namespace, pod, container string, pty PtyHandler) error {
	defer pty.Done()

	clientset, err := c.getClientset(ctx)
	if err != nil {
		return fmt.Errorf("failed to get clientset: %v", err)
	}

	req := clientset.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(pod).
		Namespace(namespace).
		SubResource("exec")

	req.VersionedParams(&corev1.PodExecOptions{
		Container: container,
		Command:   []string{"/bin/sh", "-c", "TERM=xterm-256color; export TERM; [ -x /bin/bash ] && /bin/bash || /bin/sh"},
		Stdin:     true,
		Stdout:    true,
		Stderr:    true,
		TTY:       true,
	}, scheme.ParameterCodec)

	exec, err := remotecommand.NewSPDYExecutor(c.baseConfig, "POST", req.URL())
	if err != nil {
		return fmt.Errorf("failed to initialize spdy executor: %v", err)
	}

	err = exec.StreamWithContext(ctx, remotecommand.StreamOptions{
		Stdin:             pty,
		Stdout:            pty,
		Stderr:            pty,
		TerminalSizeQueue: pty,
		Tty:               true,
	})

	if err != nil {
		return fmt.Errorf("exec stream failed: %v", err)
	}

	return nil
}

// Exec mock implementation for DEV_MODE
func (m *MockClient) Exec(ctx context.Context, namespace, pod, container string, pty PtyHandler) error {
	defer pty.Done()

	user, _ := ctx.Value("user").(UserContext)
	if user.Role == "viewer" {
		_, _ = pty.Write([]byte("Error: RBAC 'viewer' role is not authorized to exec into pods.\r\n"))
		return nil
	}

	welcome := fmt.Sprintf("\r\n\033[1;36mK-View Mock Terminal\033[0m\r\nConnected to %s/%s:%s\r\n\r\n", namespace, pod, container)
	_, _ = pty.Write([]byte(welcome))

	prompt := fmt.Sprintf("\033[1;32mroot@%s\033[0m:/# ", pod)
	_, _ = pty.Write([]byte(prompt))

	buf := make([]byte, 1024)
	var cmdBuffer string

	for {
		select {
		case <-ctx.Done():
			return nil
		default:
			n, err := pty.Read(buf)
			if err != nil {
				return nil // Disconnected
			}

			// Poor man's telnet echo parsing
			str := string(buf[:n])
			for _, char := range str {
				switch char {
				case '\r', '\n':
					_, _ = pty.Write([]byte("\r\n"))
					handleMockCommand(strings.TrimSpace(cmdBuffer), pty)
					cmdBuffer = ""
					_, _ = pty.Write([]byte(prompt))
				case '\b', 127: // backspace
					if len(cmdBuffer) > 0 {
						cmdBuffer = cmdBuffer[:len(cmdBuffer)-1]
						_, _ = pty.Write([]byte("\b \b"))
					}
				case 3: // Ctrl+C
					_, _ = pty.Write([]byte("^C\r\n"))
					cmdBuffer = ""
					_, _ = pty.Write([]byte(prompt))
				case 4: // Ctrl+D
					_, _ = pty.Write([]byte("exit\r\n"))
					return nil
				default:
					if char >= 32 && char <= 126 { // Printables
						cmdBuffer += string(char)
						_, _ = pty.Write([]byte(string(char)))
					}
				}
			}
		}
	}
}

func handleMockCommand(cmd string, pty PtyHandler) {
	if cmd == "" {
		return
	}
	parts := strings.Fields(cmd)
	switch parts[0] {
	case "ls":
		_, _ = pty.Write([]byte("bin  boot  dev  etc  home  lib  media  mnt  opt  root  run  sbin  srv  sys  tmp  usr  var\r\n"))
	case "pwd":
		_, _ = pty.Write([]byte("/\r\n"))
	case "whoami":
		_, _ = pty.Write([]byte("root\r\n"))
	case "ps":
		_, _ = pty.Write([]byte("  PID TTY          TIME CMD\r\n    1 ?        00:00:00 app-server\r\n   15 pts/0    00:00:00 bash\r\n"))
	case "env":
		_, _ = pty.Write([]byte("KUBERNETES_SERVICE_PORT=443\r\nKUBERNETES_PORT=tcp://10.96.0.1:443\r\nHOSTNAME=mock-pod-abcdef\r\nSHLVL=1\r\nHOME=/root\r\nTERM=xterm-256color\r\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\r\n"))
	case "date":
		_, _ = pty.Write([]byte(fmt.Sprintf("%s\r\n", time.Now().Format(time.RFC1123))))
	case "uptime":
		_, _ = pty.Write([]byte(" 10:24:00 up 25 days,  1:15,  1 user,  load average: 0.04, 0.05, 0.01\r\n"))
	case "clear":
		_, _ = pty.Write([]byte("\033[2J\033[H"))
	case "exit":
		// Handled by client disconnect
	default:
		_, _ = pty.Write([]byte(fmt.Sprintf("bash: %s: command not found\r\n", parts[0])))
	}
}
