import { Redirect } from 'expo-router';

// Root → the "Now" tab, the app's home base.
export default function Index() {
  return <Redirect href="/now" />;
}
