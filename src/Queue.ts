import {  Message } from "./Database";

type ProcessingMessage = {
    productKey: string,
    workerId: number
}

export class Queue {
    private messages: Message[]
    private lockedProducts: Set<string>
    private currentlyProcessingMessages: Map<string,ProcessingMessage>
    private LOOKUP_LIMIT = 50

    constructor() {
        this.messages = []
        this.lockedProducts = new Set<string>()
        this.currentlyProcessingMessages = new Map<string, ProcessingMessage>()
    }

    Enqueue = (message: Message) => {
        this.messages.push(message)
    }

    Dequeue = (workerId: number): Message | undefined => {
        let messageIndex = this.GetNonLockedMessageIndex();
        if (messageIndex === -1) {
            return undefined
        }

        const message = this.messages.splice(messageIndex,1)[0]
        this.lockedProducts.add(message.key)
        this.currentlyProcessingMessages.set(message.id, { productKey: message.key, workerId })

        return message
    }

    Confirm = (workerId: number, messageId: string) => {
        const processingMessageInfo = this.currentlyProcessingMessages.get(messageId)
        if (processingMessageInfo) {
            this.lockedProducts.delete(processingMessageInfo.productKey)
            this.currentlyProcessingMessages.delete(messageId)
        }
    }

    Size = () => {
        return this.messages.length
    }

    private GetNonLockedMessageIndex = (): number => {
        for (let index = 0; (index < this.messages.length) && (index < this.LOOKUP_LIMIT); index++) {
            if (!this.lockedProducts.has(this.messages[index].key)) {
                return index
            }
        }
        return -1
    }
}

