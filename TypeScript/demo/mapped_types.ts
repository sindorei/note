interface User {
    
    /**
     * wei
     */
    uid: string
    nickName: string
    gender: number
    portraitUrl: string
    footprint: string
    channel: number
}

interface UserInfo {
    uid: string
    nickName: string
}


type up = Partial<User>
// const userPartial: Partial<User> = {
//     uid: '',
// }


const userInfo: UserInfo = {
    uid: '',
    nickName: ''
}

type upick = Pick<User, 'nickName' | 'uid'>
const userPick: Pick<User, 'nickName' | 'uid'> = {
    nickName: '',
    uid: ''
}