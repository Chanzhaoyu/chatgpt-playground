import express from 'express'
import type { ChatContext, ChatMessage } from './chatgpt'
import { chatConfig, chatReply, chatReplyProcess } from './chatgpt'

interface ChatRequest {
  prompt: string
  conversationId?: string
  parentMessageId?: string
}

const app = express()
const router = express.Router()

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat', async (req, res) => {
  try {
    const { prompt, options = {} } = req.body as { prompt: string; options?: ChatContext }
    const response = await chatReply(prompt, options)
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

app.get('/chat-process', async (req, res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const { prompt, conversationId, parentMessageId } = req.query as unknown as ChatRequest

  const options: ChatContext = {}

  if (conversationId)
    options.conversationId = conversationId

  if (parentMessageId)
    options.parentMessageId = parentMessageId

  global.console.log(prompt)
  global.console.log(options)

  try {
    await chatReplyProcess(prompt, { ...options }, (chat: ChatMessage) => {
      global.console.log(chat)
      res.write(`data: ${JSON.stringify(chat)}\n\n`)
    })
  }
  catch (e) {
    res.write(`data: ${JSON.stringify(e)}\n\n`)
  }
  finally {
    res.end()
  }

  res.on('close', () => {
    global.console.log('close')
  })
})

// 设置路由，该路由将发送 SSE 数据
app.get('/events', async (req, res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const { prompt } = req.query as unknown as { prompt: string }

  res.write('retry: 10000\n\n')

  for (let i = 0; i < 4; i++) {
    res.write(`data: ${prompt}-${i}\n\n`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  res.end()

  res.on('close', () => {
    global.console.log('close')
  })
})

router.post('/config', async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

app.use('', router)
app.use('/api', router)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
