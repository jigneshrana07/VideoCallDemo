import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React from 'react'

const Button = ({ onPress, iconImage, bacgroundColor, style }) => {
    return (
        <TouchableOpacity onPress={onPress} style={[{ backgroundColor: bacgroundColor }, style, styles.button]}>
            <Image source={iconImage} style={{ height: 20, width: 20, resizeMode: 'contain', tintColor: '#FFF' }} />
        </TouchableOpacity>
    )
}

export default Button

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        padding: 10,
        elevation: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100
    }
})