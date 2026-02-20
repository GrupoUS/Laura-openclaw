---
name: mobile-development
description: Use when building React Native, Flutter, or cross-platform mobile apps, implementing native features, handling touch interactions, optimizing mobile performance, or submitting to app stores. Triggers on mobile, react native, flutter, ios, android, app store, expo, touch, native.
---

# Mobile Development Skill

Comprehensive mobile development for React Native and Flutter cross-platform applications.

## When to Use

### Trigger Symptoms (Use this skill when...)

- Building React Native or Flutter apps
- Implementing native features
- Setting up Expo projects
- Optimizing mobile performance
- Handling platform differences (iOS vs Android)
- App Store / Play Store submission
- Debugging mobile-specific issues
- Touch gesture implementation

### Use ESPECIALLY when:

- New mobile project starting
- Platform-specific bugs
- Performance issues (60fps target)
- Touch target compliance needed
- Offline functionality required

### When NOT to Use

- Web frontend → use `frontend-rules` or `frontend-design@claude-plugins-official` skill
- Backend API → use `backend-design` skill
- Database work → use `clerk-neon-auth` skill

---

## Core Philosophy

> "Mobile is not a small desktop. Design for touch, respect battery, and embrace platform conventions."

---

## Touch Target Standards

| Platform | Minimum Size | Recommended | Spacing |
|----------|--------------|-------------|---------|
| **iOS** | 44×44 pt | 48×48 pt | 8-12 px |
| **Android** | 48×48 dp | 48×48 dp | 8-12 dp |

---

## Performance Targets

| Metric | Target | Why |
|--------|--------|-----|
| **Frame Rate** | 60fps | Smooth animations |
| **JS Bundle** | < 20MB | Fast startup |
| **Memory** | < 200MB | Prevent crashes |
| **Cold Start** | < 3s | User retention |

---

## Framework Selection

| Scenario | Recommendation |
|----------|----------------|
| Cross-platform, JavaScript team | React Native |
| Cross-platform, Dart/Flutter team | Flutter |
| Maximum code sharing | Expo (React Native) |
| Native iOS feel | SwiftUI (iOS only) |
| Native Android | Kotlin (Android only) |

---

## React Native Patterns

### List Performance (CRITICAL)

```typescript
// ✅ Correct: FlatList with memoization
const Item = React.memo(({ item }) => <ItemView item={item} />);

const renderItem = useCallback(({ item }) => <Item item={item} />, []);

const keyExtractor = useCallback((item) => item.id, []);

<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

```typescript
// ❌ NEVER: ScrollView for lists (memory explosion)
<ScrollView>
  {items.map(item => <Item key={item.id} item={item} />)}
</ScrollView>
```

### Animation Performance

```typescript
// ✅ Always use native driver for smooth 60fps
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // CRITICAL
}).start();
```

---

## Flutter Patterns

### List Performance

```dart
// ✅ Correct: ListView.builder
ListView.builder(
  itemCount: items.length,
  itemExtent: 56, // Fixed height for performance
  itemBuilder: (context, index) => ItemWidget(
    key: ValueKey(items[index].id),
    item: items[index],
  ),
)

// ❌ NEVER: Column with map for long lists
Column(
  children: items.map((i) => ItemWidget(item: i)).toList(),
)
```

### Const Constructors

```dart
// ✅ Use const for immutable widgets
const Text('Hello')
const Icon(Icons.star)

// Improves rebuild performance
```

---

## Platform-Specific Considerations

### iOS

| Aspect | Guideline |
|--------|-----------|
| Navigation | Edge swipe back gesture |
| Tabs | Bottom tab bar |
| Status bar | Light/dark content |
| Safe areas | Respect notch/Dynamic Island |
| Haptics | UIImpactFeedbackGenerator |

### Android

| Aspect | Guideline |
|--------|-----------|
| Navigation | Hardware/software back button |
| Tabs | Top tabs or bottom nav |
| Status bar | Transparent with flags |
| Gestures | Android 10+ gesture navigation |
| Haptics | HapticFeedbackConstants |

---

## State Management

### React Native

| Complexity | Solution |
|------------|----------|
| Simple | useState + Context |
| Medium | Zustand |
| Complex | Redux Toolkit |
| Server State | TanStack Query |

### Flutter

| Complexity | Solution |
|------------|----------|
| Simple | StatefulWidget |
| Medium | Provider |
| Complex | Riverpod / BLoC |

---

## Secure Storage

| Platform | React Native | Flutter |
|----------|--------------|---------|
| **iOS** | expo-secure-store | flutter_secure_storage |
| **Android** | expo-secure-store | flutter_secure_storage |
| **Never Use** | AsyncStorage for tokens | SharedPreferences for tokens |

```typescript
// ✅ Secure token storage
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('token', userToken);
const token = await SecureStore.getItemAsync('token');
```

---

## Offline Strategy

### Data Layer

```typescript
// Cache-first with network sync
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      networkMode: 'offlineFirst',
    },
  },
});
```

### Sync Pattern

1. Write to local cache immediately
2. Queue mutation for sync
3. Sync when online
4. Handle conflicts (last-write-wins or custom)

---

## Build Verification

### Pre-Release Checklist

- [ ] Debug build passes
- [ ] Release build passes
- [ ] App launches on device
- [ ] No console errors
- [ ] Memory stable
- [ ] 60fps maintained
- [ ] Touch targets ≥ 44pt/dp
- [ ] Offline mode works
- [ ] Deep links work
- [ ] Push notifications work

### Build Commands

```bash
# React Native
cd android && ./gradlew assembleRelease
cd ios && xcodebuild -workspace App.xcworkspace -scheme App

# Expo
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Flutter
flutter build apk --release
flutter build ios --release
```

---

## Debugging Tools

| Tool | Use For |
|------|---------|
| Flipper | Network, layout, performance |
| React DevTools | Component tree, props |
| Chrome DevTools | Debug JS in WebView |
| Xcode Instruments | iOS memory, CPU |
| Android Profiler | Android memory, CPU |
| Logcat | Android system logs |

---

## Anti-Patterns

| Never | Always |
|-------|--------|
| ScrollView for lists | FlatList / ListView.builder |
| Inline renderItem | useCallback + React.memo |
| AsyncStorage for tokens | SecureStore / Keychain |
| Hardcoded API keys | Environment variables |
| Skip platform checks | iOS = iOS feel, Android = Android feel |
| Ignore thumb zone | Primary CTAs in reach |

---

## Quality Checklist

### Performance

- [ ] Lists use FlatList/ListView.builder
- [ ] renderItem memoized
- [ ] Animations use native driver
- [ ] No console.log in production
- [ ] Images optimized

### UX

- [ ] Touch targets ≥ 44pt/dp
- [ ] Loading states shown
- [ ] Error states with retry
- [ ] Offline graceful degradation
- [ ] Platform conventions followed

### Security

- [ ] Tokens in SecureStore
- [ ] No hardcoded secrets
- [ ] SSL pinning in production
- [ ] No sensitive data in logs

---

## Quick Commands

```bash
# Start React Native
npx expo start

# Start Flutter
flutter run

# Run on specific device
npx expo run:ios --device
flutter run -d <device_id>

# List devices
xcrun simctl list devices
flutter devices
adb devices
```
