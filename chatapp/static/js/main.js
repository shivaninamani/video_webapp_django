const APP_ID = '15a9b192c2a54d5f8cef8d310296e8e8'
const CHANNEL = sessionStorage.getItem('room')
const TOKEN = sessionStorage.getItem('token')
let UID=Number(sessionStorage.getItem('UID'))
let NAME=sessionStorage.getItem('name')




const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {
    document.getElementById('roomname').innerText=CHANNEL

    client.on('user-published',handleUserJoined)
    client.on('user-left',handleUserLeft)
    
    try{
        await client.join(APP_ID, CHANNEL, TOKEN, UID)
    }
    catch(error){
        console.error(error);
        window.open('/','_self')
    }
    
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    let member= await createMember()

    let player = `<div id='usercontainer-${UID}' class="videocontainer">
                     <div class="usernamewrap"><span class="user-name">${member.name}</span>
                     </div>
                     <div id='user-${UID}' class="videoplayer">
                     </div>
                  </div>`
    document.getElementById('video').insertAdjacentHTML('beforeend', player)

    let generateid = `user-${UID}`
    localTracks[1].play(generateid)
    //console.log('after play')

    await client.publish([localTracks[0], localTracks[1]])
    //console.log('after pub')

}

let handleUserJoined =async(user,mediaType)=>{
    remoteUsers[user.uid]=user
    await client.subscribe(user,mediaType)
    if(mediaType == 'video'){
        let player=document.getElementById(`usercontainer-${user.uid}`)
        if(player!=null){
            player.remove()
        }

        let member=await getMember(user)
        console.log(member)
        

        player=`<div id='usercontainer-${user.uid}' class="videocontainer">
        <div class="usernamewrap"><span class="user-name">${member.name}</span>
        </div>
        <div id='user-${user.uid}' class="videoplayer">
        </div>
        </div>`
        document.getElementById('video').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`user-${user.uid}`)

    }
    if (mediaType=='audio'){
        user.audioTrack.play()
    }
}

let handleUserLeft=async(user,mediaType)=>{
    delete remoteUsers[user.id]
    document.getElementById(`usercontainer-${user.uid}`).remove()
}

let leaveAndRemoveStream = async()=>{
    for(let i=0;localTracks.length>i;i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    await client.leave()
    deleteMember()
    window.open('/','_self')
}


let toggleCam=async(e)=>{
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor='#fff'
    }
    else{
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor='rgb(255,80,8,1)'
    }
}

let toggleMic=async(e)=>{
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.style.backgroundColor='#fff'
    }
    else{
        await localTracks[0].setMuted(true)
        e.target.style.backgroundColor='rgb(255,80,8,1)'
    }
}

let createMember=async()=>{
    let response= await fetch('/create_member/',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME,'room_name':CHANNEL,'UID':UID})
    })
    let member=await response.json()
    return member
}

let getMember=async(user)=>{
    let response=await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let data=await response.json()
    return data
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
}

window.addEventListener("beforeunload",deleteMember);

joinAndDisplayLocalStream()
document.getElementById('leave-btn').addEventListener('click',leaveAndRemoveStream)
document.getElementById('video-btn').addEventListener('click',toggleCam)
document.getElementById('mic-btn').addEventListener('click',toggleMic)


