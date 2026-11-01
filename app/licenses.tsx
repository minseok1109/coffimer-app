import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import packageJson from '@/package.json';

// Read from package.json so the screen stays in sync with dependency upgrades.
const dependencyVersions: Record<string, string> = {
  ...packageJson.devDependencies,
  ...packageJson.dependencies,
};

const getDependencyVersion = (packageName: string) =>
  dependencyVersions[packageName] ?? '';

interface License {
  name: string;
  version: string;
  license: string;
  repository?: string;
  description: string;
}

export default function LicensesScreen() {
  const router = useRouter();

  const licenses: License[] = [
    {
      name: 'React Native',
      version: getDependencyVersion('react-native'),
      license: 'MIT License',
      repository: 'https://github.com/facebook/react-native',
      description: '크로스 플랫폼 모바일 앱 개발 프레임워크',
    },
    {
      name: 'Expo',
      version: getDependencyVersion('expo'),
      license: 'MIT License',
      repository: 'https://github.com/expo/expo',
      description: 'React Native 개발 플랫폼 및 도구',
    },
    {
      name: 'React',
      version: getDependencyVersion('react'),
      license: 'MIT License',
      repository: 'https://github.com/facebook/react',
      description: '사용자 인터페이스 구축을 위한 JavaScript 라이브러리',
    },
    {
      name: 'Supabase',
      version: getDependencyVersion('@supabase/supabase-js'),
      license: 'Apache-2.0 License',
      repository: 'https://github.com/supabase/supabase-js',
      description: '오픈소스 Firebase 대안 - 백엔드 서비스',
    },
    {
      name: 'React Query (TanStack Query)',
      version: getDependencyVersion('@tanstack/react-query'),
      license: 'MIT License',
      repository: 'https://github.com/TanStack/query',
      description: '데이터 fetching 및 상태 관리 라이브러리',
    },
    {
      name: 'Expo Router',
      version: getDependencyVersion('expo-router'),
      license: 'MIT License',
      repository: 'https://github.com/expo/router',
      description: '파일 기반 라우팅 시스템',
    },
    {
      name: 'Expo Audio',
      version: getDependencyVersion('expo-audio'),
      license: 'MIT License',
      repository: 'https://github.com/expo/expo',
      description: '오디오 재생 및 녹음 기능',
    },
    {
      name: 'Expo Notifications',
      version: getDependencyVersion('expo-notifications'),
      license: 'MIT License',
      repository: 'https://github.com/expo/expo',
      description: '푸시 알림 및 로컬 알림 기능',
    },
    {
      name: 'React Native Gesture Handler',
      version: getDependencyVersion('react-native-gesture-handler'),
      license: 'MIT License',
      repository:
        'https://github.com/software-mansion/react-native-gesture-handler',
      description: '네이티브 제스처 및 터치 이벤트 처리',
    },
    {
      name: 'React Native Reanimated',
      version: getDependencyVersion('react-native-reanimated'),
      license: 'MIT License',
      repository: 'https://github.com/software-mansion/react-native-reanimated',
      description: '고성능 애니메이션 라이브러리',
    },
    {
      name: 'Day.js',
      version: getDependencyVersion('dayjs'),
      license: 'MIT License',
      repository: 'https://github.com/iamkun/dayjs',
      description: '경량 날짜 처리 라이브러리',
    },
    {
      name: 'React Hook Form',
      version: getDependencyVersion('react-hook-form'),
      license: 'MIT License',
      repository: 'https://github.com/react-hook-form/react-hook-form',
      description: 'React를 위한 고성능 폼 라이브러리',
    },
    {
      name: 'Zod',
      version: getDependencyVersion('zod'),
      license: 'MIT License',
      repository: 'https://github.com/colinhacks/zod',
      description: 'TypeScript 우선 스키마 검증 라이브러리',
    },
    {
      name: 'TypeScript',
      version: getDependencyVersion('typescript'),
      license: 'Apache-2.0 License',
      repository: 'https://github.com/microsoft/TypeScript',
      description: 'JavaScript에 정적 타입을 추가하는 언어',
    },
  ];

  const handleLicensePress = (license: License) => {
    if (license.repository) {
      WebBrowser.openBrowserAsync(license.repository);
    }
  };

  const renderLicenseItem = (license: License, index: number) => (
    <TouchableOpacity
      key={`${license.name}-${index}`}
      onPress={() => handleLicensePress(license)}
      style={styles.licenseItem}
    >
      <View style={styles.licenseHeader}>
        <Text style={styles.licenseName}>{license.name}</Text>
        <Text style={styles.licenseVersion}>v{license.version}</Text>
      </View>
      <Text style={styles.licenseDescription}>{license.description}</Text>
      <View style={styles.licenseFooter}>
        <View style={styles.licenseTag}>
          <Text style={styles.licenseTagText}>{license.license}</Text>
        </View>
        {license.repository && (
          <Ionicons color="#8B4513" name="open-outline" size={16} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons color="#333" name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>오픈소스 라이선스</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <View style={styles.introHeader}>
            <Ionicons color="#8B4513" name="code-slash" size={32} />
            <Text style={styles.introTitle}>오픈소스 라이브러리</Text>
          </View>
          <Text style={styles.introDescription}>
            이 앱은 다음 오픈소스 라이브러리들을 사용하여 개발되었습니다. 각
            라이브러리의 라이선스를 확인하시려면 항목을 터치하세요.
          </Text>
        </View>

        {/* Licenses List */}
        <View style={styles.licensesContainer}>
          {licenses.map((license, index) => renderLicenseItem(license, index))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            모든 오픈소스 라이브러리는 해당 라이선스 조건에 따라 사용됩니다.
          </Text>
          <Text style={styles.footerSubtext}>
            오픈소스 커뮤니티에 감사드립니다. 🙏
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    paddingBottom: 30,
  },
  introSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  introDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  licensesContainer: {
    marginHorizontal: 20,
  },
  licenseItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  licenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  licenseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  licenseVersion: {
    fontSize: 12,
    color: '#8B4513',
    backgroundColor: '#f8f4f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  licenseDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  licenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  licenseTag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  licenseTagText: {
    fontSize: 11,
    color: '#2d5a2d',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
