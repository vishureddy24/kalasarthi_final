'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Sparkles, Wand2, Send, Bot, User, Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function AIToolsPage() {
  const { user } = useAuth()
  const [genTitle, setGenTitle] = useState('')
  const [genCategory, setGenCategory] = useState('')
  const [genMaterials, setGenMaterials] = useState('')
  const [genResult, setGenResult] = useState('')
  const [generating, setGenerating] = useState(false)

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! I\'m your Artisan Buddy. I can help you with product pricing, market trends, craft techniques, government schemes, and business tips. How can I help you today?' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleGenerate = async () => {
    if (!genTitle) {
      toast.error('Please enter a product title')
      return
    }
    setGenerating(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: genTitle, category: genCategory, materials: genMaterials, craftType: genCategory }),
      })
      if (res.ok) {
        const data = await res.json()
        setGenResult(data.description)
        toast.success('Description generated!')
      } else {
        toast.error('Failed to generate description')
      }
    } catch (err) {
      toast.error('Failed to generate description')
    }
    setGenerating(false)
  }

  const handleChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    }
    setChatLoading(false)
  }

  const handleCopy = () => {
    if (genResult) {
      navigator.clipboard.writeText(genResult)
      toast.success('Copied to clipboard!')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> AI Tools
        </h2>
        <p className="text-muted-foreground">Powered by Google Gemini AI to help grow your business</p>
      </div>

      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="description" className="gap-2"><Wand2 className="h-4 w-4" /> Description Generator</TabsTrigger>
          <TabsTrigger value="chat" className="gap-2"><Bot className="h-4 w-4" /> Artisan Buddy</TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Description Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Product Title *</Label>
                  <Input value={genTitle} onChange={(e) => setGenTitle(e.target.value)} placeholder="e.g. Madhubani Painting" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={genCategory} onChange={(e) => setGenCategory(e.target.value)} placeholder="e.g. Paintings & Art" />
                </div>
                <div className="space-y-2">
                  <Label>Materials</Label>
                  <Input value={genMaterials} onChange={(e) => setGenMaterials(e.target.value)} placeholder="e.g. Natural dyes, Handmade paper" />
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                {generating ? 'Generating...' : 'Generate Description'}
              </Button>
              {genResult && (
                <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Generated</span>
                    <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-3 w-3 mr-1" /> Copy</Button>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{genResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="flex flex-col" style={{ height: '600px' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-teal-600" /> Artisan Buddy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pb-4">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-2 max-w-[80%]`}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="h-4 w-4 text-teal-600" />
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-tr-sm'
                          : 'bg-muted text-foreground rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="h-4 w-4 text-amber-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-teal-600" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Artisan Buddy anything..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                  disabled={chatLoading}
                  className="h-11"
                />
                <Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} className="h-11 px-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
