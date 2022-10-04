import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { RTCView } from 'react-native-webrtc'

function ButtonContainer({ hangup }) {
    return (
        <TouchableOpacity onPress={hangup}>
            <Image source={require('../asset/images/call_end.png')} style={{ height: 50, width: 50, resizeMode: 'contain' }} />
        </TouchableOpacity>
    )
}
const Video = ({ hangup, localStream, remoteStream }) => {
    //On call we will just display the local stream
    if (localStream && !remoteStream) {
        return (
            <View style={styles.container}>
                <RTCView
                    streamURL={localStream.toURL()}
                    objectFit={'cover'}
                    style={styles.video}
                />
                <ButtonContainer hangup={hangup} />
            </View>
        )
    }
    //Once the cal is connected we will display
    //local stream on top of remote stream
    if (localStream && remoteStream) {
        return (
            <View style={styles.container}>
                <RTCView
                    streamURL={remoteStream.toURL()}
                    objectFit={'cover'}
                    style={styles.video}
                />
                <RTCView
                    streamURL={localStream.toURL()}
                    objectFit={'cover'}
                    style={styles.videoLocal}
                />
                <ButtonContainer hangup={hangup} />
            </View>
        )
    }
    return (
        <View>
            <Text>Video</Text>
        </View>
    )
}

export default Video

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    video: {
        position: 'absolute',
        width: '100%',
        height: '100%'
    },
    videoLocal: {
        position: 'absolute',
        width: 100,
        height: 150,
        top: 0,
        left: 20,
        elevation: 10
    }
})