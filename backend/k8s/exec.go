package k8s

import (
	"context"
	"fmt"
	"io"

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
func (c *Client) Exec(ctx context.Context, namespace, pod, container, shell string, pty PtyHandler) error {
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

	// Determine the command to run
	var command []string
	if shell == "bash" {
		command = []string{"/bin/bash"}
	} else if shell == "sh" {
		command = []string{"/bin/sh"}
	} else {
		// Default auto-detection logic
		command = []string{"/bin/sh", "-c", "TERM=xterm-256color; export TERM; [ -x /bin/bash ] && /bin/bash || /bin/sh"}
	}

	req.VersionedParams(&corev1.PodExecOptions{
		Container: container,
		Command:   command,
		Stdin:     true,
		Stdout:    true,
		Stderr:    true,
		TTY:       true,
	}, scheme.ParameterCodec)

	exec, err := remotecommand.NewSPDYExecutor(c.GetConfig(ctx), "POST", req.URL())
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
