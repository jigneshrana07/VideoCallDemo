import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Button from './Button'

const GettingCall = ({ hangup, join }) => {
    return (
        <View style={{ width: '100%', height: '100%', backgroundColor: 'green' }}>
            <View style={styles.buttonConatiner}>
                <TouchableOpacity onPress={hangup}>
                    <Image source={require('../asset/images/call_end.png')} style={{ height: 50, width: 50, resizeMode: 'contain' }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={join}>
                    <Image source={require('../asset/images/call_pickup.png')} style={{ height: 50, width: 50, resizeMode: 'contain' }} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default GettingCall

const styles = StyleSheet.create({
    buttonConatiner: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: '20%',
        position: 'absolute',
        bottom: 15
    }
})