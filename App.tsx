import { Platform, View, ScrollView, useWindowDimensions } from 'react-native';
import AtBatScreen from './src/screens/AtBatScreen';

export default function App() {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <AtBatScreen />;
  }

  // Web: phone-sized column, centered.
  // On narrow (phone) screens, add space below the app so the page can
  // scroll the controls above the Netlify badge.
  const isPhone = width < 500;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#03081A' }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <View style={{ width: '100%', maxWidth: 430, height: isPhone ? Math.max(height, 800) : Math.min(height, 932) }}>
        <AtBatScreen />
      </View>
      {isPhone && <View style={{ height: 72 }} />}
    </ScrollView>
  );
}