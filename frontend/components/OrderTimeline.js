'use client'

import { useLanguage } from '@/contexts/LanguageContext'

const steps = ["created", "paid", "shipped", "delivered"]

export default function OrderTimeline({ timeline = [] }) {
  const { isHindi } = useLanguage()

  const translateStep = (step) => {
    if (!isHindi) return step
    const map = {
      created: 'बनाया गया',
      paid: 'भुगतान किया गया',
      shipped: 'भेज दिया',
      delivered: 'पहुंचा दिया'
    }
    return map[step] || step
  }

  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, index) => {
        const line = timeline.find(t => t.status === step)
        const isCompleted = !!line
        const isLastCompleted = [...timeline].reverse()[0]?.status === step

        return (
          <div key={step} className="flex gap-4 relative">
            {index < steps.length - 1 && (
              <div 
                className={`absolute left-[7px] top-6 bottom-[-16px] w-[2px] ${
                  timeline.some(t => t.status === steps[index + 1]) ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
            <div
              className={`w-4 h-4 mt-1 rounded-full border-2 z-10 ${
                isCompleted 
                  ? 'bg-primary border-primary' 
                  : 'bg-background border-muted-foreground/30'
              } ${isLastCompleted ? 'ring-4 ring-primary/20' : ''}`}
            />
            <div className="flex-1 pb-4">
              <p className={`font-semibold capitalize ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                {translateStep(step)}
              </p>
              {isCompleted && line?.time && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {new Date(line.time).toLocaleString('en-IN', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
