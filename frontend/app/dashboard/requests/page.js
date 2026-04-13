'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  User, 
  Phone, 
  IndianRupee, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  Eye,
  RefreshCw,
  Download,
  Send,
  History,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { jsPDF } from 'jspdf'

// Image Preview Modal Component
function ImagePreviewModal({ images, currentIndex, onClose, onNext, onPrev }) {
  if (!images || images.length === 0) return null

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300"
        >
          <XCircle className="h-8 w-8" />
        </button>

        {/* Image Counter */}
        <div className="absolute -top-12 left-0 text-white text-sm">
          Image {currentIndex + 1} of {images.length}
        </div>

        {/* Main Image */}
        <img
          src={images[currentIndex]}
          alt={`Sample ${currentIndex + 1}`}
          className="w-full h-full object-contain max-h-[80vh] rounded-lg"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
            >
              ←
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
            >
              →
            </button>
          </>
        )}

        {/* Thumbnails */}
        <div className="flex gap-2 mt-4 justify-center">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onNext(idx)}
              className={`w-16 h-16 rounded overflow-hidden border-2 ${
                idx === currentIndex ? 'border-white' : 'border-transparent'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Timeline Component
function RequestTimeline({ history = [] }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />
      case 'accepted': return <CheckCircle className="h-3 w-3" />
      case 'rejected': return <XCircle className="h-3 w-3" />
      default: return <History className="h-3 w-3" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500'
      case 'accepted': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <History className="h-4 w-4" />
        Timeline
      </h4>
      <div className="space-y-3">
        {history.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 ${getStatusColor(item.status)}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize flex items-center gap-1">
                  {getStatusIcon(item.status)}
                  {item.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {item.note && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Chat Component
function ChatInterface({ requestId, user, senderRole }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!requestId || !user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/chat?requestId=${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }, [requestId, user])

  // Poll for new messages
  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    setLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          message: newMessage.trim(),
          senderRole
        })
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border rounded-lg p-4 bg-muted/30">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Chat
      </h4>
      
      {/* Messages */}
      <div className="h-40 overflow-y-auto space-y-2 mb-3 pr-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.senderId === user?.uid ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.senderId === user?.uid
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-xs font-medium opacity-70 mb-0.5">
                  {msg.senderName}
                </p>
                <p>{msg.message}</p>
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">
                {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
          disabled={loading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !newMessage.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}

export default function ArtisanRequestsPage() {
  const { user, userProfile } = useAuth()
  const { tx } = useLanguage()
  
  const [requests, setRequests] = useState([])

  // PDF Download Function
  const downloadRequestPDF = (request) => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setTextColor(220, 95, 0) // Orange color
    doc.text('KalaSarthi', 20, 20)
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Custom Product Request', 20, 30)
    
    // Request ID and Date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Request ID: ${request.id || 'N/A'}`, 20, 42)
    doc.text(`Date: ${new Date(request.createdAt).toLocaleDateString()}`, 20, 48)
    
    // Line separator
    doc.line(20, 52, 190, 52)
    
    // Buyer Information
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text('BUYER INFORMATION', 20, 62)
    doc.setFontSize(10)
    doc.text(`Name: ${request.buyer?.displayName || 'N/A'}`, 20, 70)
    doc.text(`Phone: ${request.buyer?.phone || 'N/A'}`, 20, 76)
    doc.text(`Email: ${request.buyer?.email || 'N/A'}`, 20, 82)
    
    // Request Details
    doc.setFontSize(12)
    doc.text('REQUEST DETAILS', 20, 95)
    doc.setFontSize(10)
    
    // Message (wrapped)
    const message = request.message || 'No message provided'
    const splitMessage = doc.splitTextToSize(message, 170)
    doc.text('Message:', 20, 103)
    doc.text(splitMessage, 20, 109)
    
    let yPos = 109 + (splitMessage.length * 5)
    
    doc.text(`Budget: ₹${request.budget || 'Not specified'}`, 20, yPos + 6)
    doc.text(`Deadline: ${request.deadline ? new Date(request.deadline).toLocaleDateString() : 'Not specified'}`, 20, yPos + 12)
    doc.text(`Status: ${request.status?.toUpperCase() || 'PENDING'}`, 20, yPos + 18)
    
    // Images note
    yPos += 30
    if (request.sampleImages?.length > 0) {
      doc.text(`Sample Images: ${request.sampleImages.length} attached`, 20, yPos)
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(9)
      doc.text('Images available in the online dashboard', 20, yPos + 6)
    }
    
    // Footer
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('KalaSarthi - Connecting Indian Artisans with the World', 20, 280)
    doc.text('Generated on ' + new Date().toLocaleString(), 20, 285)
    
    // Save
    doc.save(`KalaSarthi-Request-${request.id?.slice(-6) || Date.now()}.pdf`)
    toast.success('Request PDF downloaded!')
  }
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [previewImages, setPreviewImages] = useState([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [processing, setProcessing] = useState({})

  // Stable fetch function - wrapped in useCallback with empty deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchRequests = useCallback(async () => {
    if (!user || userProfile?.role !== 'artisan') return
    
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/custom-requests/artisan', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch - only once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRequests()
  }, [])

  // Polling every 5 seconds - only for artisans
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userProfile?.role !== 'artisan') return
    
    const interval = setInterval(fetchRequests, 5000)
    return () => clearInterval(interval)
  }, [])

  // Refetch on page focus
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleFocus = () => fetchRequests()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const handleStatusUpdate = async (requestId, status) => {
    setProcessing(prev => ({ ...prev, [requestId]: true }))
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/custom-requests/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, status })
      })

      if (res.ok) {
        toast.success(`Request ${status} successfully`)
        fetchRequests()
      } else {
        throw new Error('Failed to update')
      }
    } catch (err) {
      toast.error('Failed to update request status')
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }))
    }
  }

  const openImagePreview = (images, index) => {
    setPreviewImages(images)
    setPreviewIndex(index)
  }

  const closeImagePreview = () => {
    setPreviewImages([])
    setPreviewIndex(0)
  }

  const nextImage = (idx) => {
    if (typeof idx === 'number') {
      setPreviewIndex(idx)
    } else {
      setPreviewIndex((prev) => (prev + 1) % previewImages.length)
    }
  }

  const prevImage = () => {
    setPreviewIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length)
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      accepted: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200'
    }
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      accepted: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />
    }
    return (
      <Badge className={`${styles[status]} capitalize`}>
        {icons[status]}
        {status}
      </Badge>
    )
  }

  if (userProfile?.role !== 'artisan') {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">Only artisans can view this page</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Requests</h1>
          <p className="text-muted-foreground">
            Manage buyer requests for custom products
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchRequests}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">
              {requests.filter(r => r.status === 'pending').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'accepted').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{requests.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No requests yet</h3>
          <p className="text-muted-foreground">
            When buyers send custom product requests, they will appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Buyer Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{request.buyerName}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.buyerPhone}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Message */}
                    <div className="bg-muted rounded-lg p-4 mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Message:</p>
                      <p className="text-sm">{request.message}</p>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {request.budget && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <IndianRupee className="h-4 w-4" />
                          Budget: ₹{request.budget}
                        </span>
                      )}
                      {request.deadline && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Deadline: {new Date(request.deadline).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Received: {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Images */}
                  {request.sampleImages?.length > 0 && (
                    <div className="lg:w-64">
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        Sample Images ({request.sampleImages.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {request.sampleImages.slice(0, 4).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => openImagePreview(request.sampleImages, idx)}
                            className="relative aspect-square rounded-lg overflow-hidden group"
                          >
                            <img 
                              src={img} 
                              alt={`Sample ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadRequestPDF(request)}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  
                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 text-red-600 hover:bg-red-50"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        disabled={processing[request.id]}
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </Button>
                      <Button
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(request.id, 'accepted')}
                        disabled={processing[request.id]}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept Request
                      </Button>
                    </>
                  )}
                </div>

                {/* Timeline */}
                <RequestTimeline history={request.statusHistory || []} />

                {request.status === 'accepted' && (
                  <>
                    {/* WhatsApp Button */}
                    {request.buyerPhone && (
                      <div className="mt-4 flex items-center gap-3">
                        <a
                          href={`https://wa.me/${request.buyerPhone}?text=Hi ${request.buyerName}, I'm the artisan from KalaSarthi regarding your custom request.`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="gap-2 bg-green-600 hover:bg-green-700">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp Buyer
                          </Button>
                        </a>
                        <span className="text-sm text-muted-foreground">
                          or use chat below
                        </span>
                      </div>
                    )}
                    
                    {/* Chat Interface */}
                    <ChatInterface 
                      requestId={request.id} 
                      user={user} 
                      senderRole="artisan" 
                    />
                  </>
                )}

                {request.status === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      You declined this request
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImages.length > 0 && (
        <ImagePreviewModal
          images={previewImages}
          currentIndex={previewIndex}
          onClose={closeImagePreview}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </div>
  )
}
