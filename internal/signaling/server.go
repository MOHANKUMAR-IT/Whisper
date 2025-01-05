package signaling

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"sync"
	"time"
)

// Message represents the WebSocket message structure
type Message struct {
	Type      string      `json:"type,omitempty"`
	Sdp       interface{} `json:"sdp,omitempty"`
	From      string      `json:"from,omitempty"`
	Target    string      `json:"target,omitempty"`
	Candidate interface{} `json:"candidate,omitempty"`
	Data      interface{} `json:"data,omitempty"`
}

type Peer struct {
	ID   string
	Conn *websocket.Conn
	mu   sync.Mutex // Mutex for connection writes
}

type Server struct {
	Peers     map[string]*Peer
	PeerMutex sync.RWMutex // Use RWMutex for better concurrency
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Consider implementing proper origin checking in production
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// NewServer creates a new signaling server instance
func NewServer() *Server {
	return &Server{
		Peers: make(map[string]*Peer),
	}
}

// Register initializes the signaling server routes
func Register(router *gin.Engine) {
	s := NewServer()
	router.GET("/ws", s.handleWebSocket)
}

func (s *Server) handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	peerID := c.Query("id")
	if peerID == "" {
		log.Println("Peer ID not provided")
		conn.Close()
		return
	}

	// Check if peer ID already exists
	s.PeerMutex.RLock()
	if _, exists := s.Peers[peerID]; exists {
		s.PeerMutex.RUnlock()
		log.Printf("Peer ID %s already in use", peerID)
		conn.Close()
		return
	}
	s.PeerMutex.RUnlock()

	// Configure WebSocket
	conn.SetReadLimit(4096) // Prevent memory exhaustion
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	peer := &Peer{
		ID:   peerID,
		Conn: conn,
	}

	s.registerPeer(peer)
	defer s.unregisterPeer(peerID)

	// Start ping-pong
	go s.keepAlive(peer)

	s.broadcastPeerList(peer)
	s.handleMessages(peer)
}

func (s *Server) keepAlive(peer *Peer) {
	ticker := time.NewTicker(54 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			peer.mu.Lock()
			if err := peer.Conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(10*time.Second)); err != nil {
				peer.mu.Unlock()
				return
			}
			peer.mu.Unlock()
		}
	}
}

func (s *Server) registerPeer(peer *Peer) {
	s.PeerMutex.Lock()
	s.Peers[peer.ID] = peer
	s.PeerMutex.Unlock()

	log.Printf("Peer connected: %s", peer.ID)
}

func (s *Server) broadcastPeerList(newPeer *Peer) {
	s.PeerMutex.RLock()
	defer s.PeerMutex.RUnlock()

	// Send existing peers to new peer
	for id := range s.Peers {
		if id != newPeer.ID {
			newPeer.Conn.WriteJSON(Message{
				Type: "contacts",
				Data: map[string]string{
					"peer":   id,
					"action": "+",
				},
			})
		}
	}

	// Notify existing peers about new peer
	for _, peer := range s.Peers {
		if peer.ID != newPeer.ID {
			peer.Conn.WriteJSON(Message{
				Type: "contacts",
				Data: map[string]string{
					"peer":   newPeer.ID,
					"action": "+",
				},
			})
		}
	}
}

func (s *Server) unregisterPeer(peerID string) {
	s.PeerMutex.Lock()
	delete(s.Peers, peerID)
	s.PeerMutex.Unlock()

	// Notify remaining peers
	s.PeerMutex.RLock()
	for _, peer := range s.Peers {
		peer.Conn.WriteJSON(Message{
			Type: "contacts",
			Data: map[string]string{
				"peer":   peerID,
				"action": "-",
			},
		})
	}
	s.PeerMutex.RUnlock()

	log.Printf("Peer disconnected: %s", peerID)
}

func (s *Server) handleMessages(peer *Peer) {
	for {
		var msg Message
		if err := peer.Conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message from peer %s: %v", peer.ID, err)
			} else {
				log.Printf("Error reading message from peer %s: %v", peer.ID, err)
			}
			continue
		}

		if msg.Target == "" {
			log.Printf("Invalid message from peer %s: no target specified", peer.ID)
			continue
		}

		msg.From = peer.ID
		s.forwardMessage(peer.ID, msg.Target, msg)
	}
}

func (s *Server) forwardMessage(senderID, targetID string, message Message) {
	s.PeerMutex.RLock()
	targetPeer, exists := s.Peers[targetID]
	s.PeerMutex.RUnlock()

	if !exists {
		log.Printf("Target peer %s not found for sender %s", targetID, senderID)
		return
	}

	if err := targetPeer.Conn.WriteJSON(message); err != nil {
		log.Printf("Error forwarding message from %s to %s: %v", senderID, targetID, err)
	}
}
