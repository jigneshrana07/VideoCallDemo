import React, { useEffect, useRef } from 'react';
import {
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from './src/components/Button';
import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStream,
    mediaDevices,
} from 'react-native-webrtc';
import { useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import DeviceInfo from 'react-native-device-info';

const App = () => {
    const [remoteStream, setRemoteStream] = useState(null);
    const [webcamStarted, setWebcamStarted] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [gettingCall, setGettingCall] = useState(false)
    const [userDatas, setUserDatas] = useState([])
    const pc = useRef();
    const connecting = useRef(false)
    const servers = {
        iceServers: [
            {
                urls: [
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302',
                ],
            },
        ],
        iceCandidatePoolSize: 10,
    };

    useEffect(() => {
        (async () => {
            const user = firestore().collection('user').doc()
            let data = await firestore().collection('user')
                .where("userId", "==", await DeviceInfo.getUniqueId())
                .get()
            if (data.docs.length == 0) {
                user.set({
                    userId: await DeviceInfo.getUniqueId()
                })
            }
            firestore().collection('user').get().then(async (querySnapshot) => {
                let userData = []
                querySnapshot.forEach(async (snapshot, index) => {
                    let data = snapshot.data()
                    userData.push({ userId: data.userId })
                })
                if (userData.length !== 0) {
                    let uniquId = await DeviceInfo.getUniqueId()
                    let filterData = userData.filter((i) => i.userId != uniquId)
                    setUserDatas(filterData)
                }
            })
        })()
    }, [])

    useEffect(() => {
        firestore().collection('channels').onSnapshot(snapshot => {
            console.log('hangup snapshot', snapshot)
            if (!snapshot.docs.length) {
                return hangup()
            }
            if (!!snapshot.docs.length && !connecting.current) {
                // setGettingCall(true)
                firestore().collection('channels').get().then((querySnapshot) => {
                    querySnapshot.forEach(async (snapshot, index) => {
                        let data = snapshot.data()
                        console.log("-----> id dd", { data: await DeviceInfo.getUniqueId(), data1: data })
                        if (data.offer.userId == await DeviceInfo.getUniqueId()) {
                            console.log("-----====----->")
                            setGettingCall(true)
                        }
                    })
                }).catch((error) => {
                    alert("Something Went Wrong")
                })
            }
        })
    }, [])

    const startWebcam = async () => {
        pc.current = new RTCPeerConnection(servers);
        const local = await mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        pc.current.addStream(local);
        setLocalStream(local);
        const remote = new MediaStream();
        setRemoteStream(remote);

        // Push tracks from local stream to peer connection
        local.getTracks().forEach(track => {
            console.log(pc.current.getLocalStreams());
            pc.current.getLocalStreams()[0].addTrack(track);
        });

        // Pull tracks from remote stream, add to video stream
        pc.current.ontrack = event => {
            event.streams[0].getTracks().forEach(track => {
                remote.addTrack(track);
            });
        };

        pc.current.onaddstream = event => {
            setRemoteStream(event.stream);
        };

        setWebcamStarted(true);
    };

    const hangup = async () => {
        connecting.current = false
        setGettingCall(false)
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream.release();
        }
        setLocalStream(null);
        setRemoteStream(null);
        const cRef = firestore().collection('channels').doc('Jignesh');
        if (cRef) {
            const calleeCandidate = await cRef.collection('offerCandidates').get();
            calleeCandidate.forEach(async (candidate) => {
                await candidate.ref.delete()
            })
            const callerCandidate = await cRef.collection('answerCandidates').get();
            callerCandidate.forEach(async (candidate) => {
                await candidate.ref.delete()
            })

            cRef.delete()
        }
        if (pc.current) {
            pc.current.close();
        };
        setWebcamStarted(false)
    }

    const startCall = async (id) => {
        await startWebcam()
        connecting.current = true

        const channelDoc = firestore().collection('channels').doc('Jignesh');
        const offerCandidates = channelDoc.collection('offerCandidates');
        const answerCandidates = channelDoc.collection('answerCandidates');

        pc.current.onicecandidate = async event => {
            if (event.candidate) {
                await offerCandidates.add(event.candidate.toJSON());
            }
        };

        //create offer
        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
            userId: id
        };

        await channelDoc.set({ offer });

        // Listen for remote answer
        channelDoc.onSnapshot(snapshot => {
            const data = snapshot.data();
            if (!pc.current.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.current.setRemoteDescription(answerDescription);
            }
        });

        // When answered, add candidate to peer connection
        answerCandidates.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    pc.current.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
    };

    const joinCall = async () => {
        await startWebcam()
        connecting.current = true
        setGettingCall(false)

        const channelDoc = firestore().collection('channels').doc('Jignesh');
        const offerCandidates = channelDoc.collection('offerCandidates');
        const answerCandidates = channelDoc.collection('answerCandidates');

        pc.current.onicecandidate = async event => {
            if (event.candidate) {
                await answerCandidates.add(event.candidate.toJSON());
            }
        };

        const channelDocument = await channelDoc.get();
        const channelData = channelDocument.data();

        const offerDescription = channelData.offer;

        await pc.current.setRemoteDescription(
            new RTCSessionDescription(offerDescription),
        );

        const answerDescription = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await channelDoc.update({ answer });

        offerCandidates.onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    pc.current.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
    };

    if (gettingCall) {
        return (
            <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, color: '#FFF' }}>Calling...</Text>
                <View style={styles.buttonConatiner}>
                    <TouchableOpacity onPress={hangup}>
                        <Image source={require('./src/asset/images/call_end.png')} style={{ height: 50, width: 50, resizeMode: 'contain' }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={joinCall}>
                        <Image source={require('./src/asset/images/call_pickup.png')} style={{ height: 50, width: 50, resizeMode: 'contain' }} />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
   
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {!webcamStarted && (
                userDatas.map((i, index) => {
                    return (
                        <View key={index} style={{ justifyContent: 'space-between', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', width: '90%', paddingBottom: 10 }}>
                            <Text>{i.userId}</Text>
                            <Button
                                bacgroundColor={'gray'}
                                iconImage={require('./src/asset/images/video.png')}
                                onPress={() => startCall(i.userId)}
                            />
                        </View>
                    )
                })
            )}
            {remoteStream && (
                <RTCView
                    streamURL={remoteStream?.toURL()}
                    style={{
                        position: 'absolute',
                        width: 100,
                        height: 150,
                        top: 20,
                        left: 20,
                        elevation: 10,
                        zIndex: 9
                    }}
                    objectFit="contain"
                    mirror
                />
            )}
            {localStream && (
                <RTCView
                    streamURL={localStream?.toURL()}
                    style={styles.stream}
                    objectFit="cover"
                    mirror
                />
            )}
            {webcamStarted && <TouchableOpacity style={{ position: 'absolute', bottom: 15, zIndex: 999 }} onPress={hangup}>
                <Image source={require('./src/asset/images/call_end.png')} style={{ height: 50, width: 50, resizeMode: 'contain' }} />
            </TouchableOpacity>}
        </View>
    );
};

const styles = StyleSheet.create({
    body: {
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        width: '100%'
    },
    stream: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 10
    },
    buttons: {
        alignItems: 'flex-start',
        flexDirection: 'column',
    },
    buttonConatiner: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        bottom: 15,
        width: '60%',
        justifyContent: 'space-between',
        alignSelf: 'center'
    }
});

export default App;