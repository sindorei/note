type plat = 'wechat' | 'app' | 'qq'

type Channel<T> =  T extends plat ? true : false

type a = Channel<'wechat'>