import { Platform, View } from 'react-native';
import AtBatScreen from './src/screens/AtBatScreen';

export default function App() {
  if (Platform.OS !== 'web') {
    return <AtBatScreen />;
  }
  // Web: show the app as a phone-sized column, centered on the page
  return (
    <View style={{ flex: 1, backgroundColor: '#03081A', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, maxHeight: 932 }}>
        <AtBatScreen />
      </View>
    </View>
  );
}