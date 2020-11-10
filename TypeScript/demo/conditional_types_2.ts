


interface User {
    uid: string
    nickName: string
    gender: number
    portraitUrl: string
    footprint: string
    channel: number
}

type UserPar = Partial<User>

const user: UserPar = {
    
}

type PowerPartial<T> = {
    [U in keyof T]?: T[U] extends object ? PowerPartial<T[U]> : T[U]
}

interface Message {
    messageId: string
    content: string
    user: User
}

type MessagePar = PowerPartial<Message>


const message: MessagePar = {
    user : {
    }
}

