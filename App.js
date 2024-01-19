import React, { useRef, useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
  Button,
} from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
} from 'react-native-agora';




const App = () => {
  const agoraEngineRef = useRef(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(true);
  const [remoteUids, setRemoteUids] = useState([]);
  const [message, setMessage] = useState('');

  const hosts = [
    { token: '007eJxTYBAN3br3oIL+u5q2kJQPwT5N+5fU/mEtWnbiftZL46+FH3YpMBgbmpsZG6dZGidZGJokpiRbJFoapSWbGRknm1gamqeZXvdYldoQyMiQsvgYIyMDBIL47AwlqcUlmXnpDAwAUpMjMA==', channelName: 'testing', uid: 0 },
    { token: '007eJxTYHggK/FtM5+RqZgsh8WGitfnM7xjnvV+ZN1Qu6egxHyF1iMFBmNDczNj4zRL4yQLQ5PElGSLREujtGQzI+NkE0tD8zTTdeGrUhsCGRnaeyewMjJAIIjPwVCSWlySmZduxMAAAGbaIAE=', channelName: 'testing2', uid: 1 },
  ];

  const getPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  useEffect(() => {
    // Initialize Agora engine when the app starts
    setupVideoSDKEngine();
  }, []);

  function showMessage(msg) {
    setMessage(msg);
  }

  const setupVideoSDKEngine = async () => {
    try {
      if (Platform.OS === 'android') {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          showMessage('Successfully joined the channel');
          setIsJoined(true);
        },
        onUserJoined: (_connection, Uid) => {
          showMessage('Remote user joined with uid ' + Uid);
          setRemoteUids((prevUids) => [...prevUids, Uid]);
        },
        onUserOffline: (_connection, Uid) => {
          showMessage('Remote user left the channel. uid: ' + Uid);
          setRemoteUids((prevUids) => prevUids.filter((uid) => uid !== Uid));
        },
      });
      agoraEngine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      agoraEngine.enableVideo();
    } catch (e) {
      console.log(e);
    }
  };

  const join = async (hostIndex) => {
    try {
      agoraEngineRef.current?.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);

      const currentHost = hosts[hostIndex];
      const { token, channelName, uid } = currentHost;

      if (isHost) {
        agoraEngineRef.current?.startPreview();
        agoraEngineRef.current?.joinChannel(token, channelName, uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });
      } else {
        agoraEngineRef.current?.joinChannel(token, channelName, uid, {
          clientRoleType: ClientRoleType.ClientRoleAudience,
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const leave = () => {
    try {
      agoraEngineRef.current?.leaveChannel();
      setRemoteUids([]);
      setIsJoined(false);
      showMessage('You left the channel');
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.main}>
      <Text style={styles.head}>Agora Interactive Live Streaming Quickstart</Text>
      <View style={styles.btnContainer}>
        {hosts.map((_, index) => (
          <Text key={index} onPress={() => join(index)} style={styles.button}>
            Join Channel {index + 1}
          </Text>
        ))}
        <Text onPress={leave} style={styles.button}>
          Leave
        </Text>
      </View>
      <View style={styles.btnContainer}>
        <Text>Audience</Text>
        <Switch
          onValueChange={(switchValue) => {
            setIsHost(switchValue);
            // if (isJoined) {
            //   leave();
            // }
          }}
          value={isHost}
        />
        <Text>Host</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        {isJoined && (
          <>
            
              <React.Fragment key={uid}>
                <RtcSurfaceView canvas={{ uid }} style={styles.videoView} />
                <Text>Your stream (uid: {uid})</Text>
              </React.Fragment>
            {remoteUids.map((remoteUid) => (
              <React.Fragment key={remoteUid}>
                <RtcSurfaceView canvas={{ uid: remoteUid }} style={styles.videoView} />
                <Text>Remote user stream (uid: {remoteUid})</Text>
              </React.Fragment>
            ))}
          </>
        )} 
        <Text style={styles.info}>{message}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0055cc',
    margin: 5,
  },
  main: { flex: 1, alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: '#ddeeff', width: '100%' },
  scrollContainer: { alignItems: 'center' },
  videoView: { width: '90%', height: 200 },
  btnContainer: { flexDirection: 'row', justifyContent: 'center' },
  head: { fontSize: 20 },
  info: { backgroundColor: '#ffffe0', paddingHorizontal: 8, color: '#0000ff' },
});
