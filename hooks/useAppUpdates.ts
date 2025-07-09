import { useCallback, useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { 
  isUpdateEnabled,
  debugLog,
  UpdateStatus,
  UpdateError,
  UpdateInfo,
  UpdateMetadata
} from '../utils/updateConfig';
import {
  shouldCheckForUpdates,
  setLastCheckTime,
  getUserSettings,
  canDownloadUpdate,
  retryWithBackoff,
  formatUpdateError,
  logUpdateEvent
} from '../utils/updateHelpers';

interface UseAppUpdatesReturn {
  // 상태
  status: UpdateStatus;
  isUpdateAvailable: boolean;
  isDownloading: boolean;
  isPending: boolean;
  isChecking: boolean;
  downloadProgress: number;
  error: UpdateError | null;
  
  // 업데이트 정보
  updateInfo: UpdateInfo | null;
  currentlyRunning: Updates.UpdateInfo | null;
  
  // 액션
  checkForUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  applyUpdate: () => Promise<void>;
  dismissUpdate: () => void;
  
  // 유틸리티
  canUpdate: boolean;
  lastChecked: Date | null;
}

export const useAppUpdates = (): UseAppUpdatesReturn => {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<UpdateError | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [metadata, setMetadata] = useState<UpdateMetadata | null>(null);
  
  // expo-updates useUpdates Hook 사용
  const { 
    currentlyRunning, 
    isUpdateAvailable: nativeIsUpdateAvailable,
    isUpdatePending: nativeIsUpdatePending,
    isDownloading: nativeIsDownloading,
    isChecking: nativeIsChecking,
    downloadedUpdate,
    downloadError,
    initializationError,
    availableUpdate,
    checkError,
    lastCheckForUpdateTime
  } = Updates.useUpdates();
  
  // 업데이트 사용 가능 여부
  const canUpdate = isUpdateEnabled();
  
  // 상태 계산
  const isUpdateAvailable = nativeIsUpdateAvailable || false;
  const isDownloading = nativeIsDownloading || false;
  const isPending = nativeIsUpdatePending || false;
  const isChecking = nativeIsChecking || false;
  
  // 에러 처리
  useEffect(() => {
    if (downloadError) {
      setError(formatUpdateError(downloadError));
      setStatus('error');
      logUpdateEvent('update_download_error', { error: downloadError.message });
    } else if (checkError) {
      setError(formatUpdateError(checkError));
      setStatus('error');
      logUpdateEvent('update_check_error', { error: checkError.message });
    } else if (initializationError) {
      setError(formatUpdateError(initializationError));
      setStatus('error');
      logUpdateEvent('update_initialization_error', { error: initializationError.message });
    } else {
      setError(null);
    }
  }, [downloadError, checkError, initializationError]);
  
  // 상태 업데이트
  useEffect(() => {
    if (isChecking) {
      setStatus('checking');
    } else if (isUpdateAvailable) {
      setStatus('available');
    } else if (isDownloading) {
      setStatus('downloading');
    } else if (isPending) {
      setStatus('pending');
    } else if (error) {
      setStatus('error');
    } else {
      setStatus('idle');
    }
  }, [isChecking, isUpdateAvailable, isDownloading, isPending, error]);
  
  // 업데이트 정보 설정
  useEffect(() => {
    if (availableUpdate) {
      setUpdateInfo({
        isAvailable: true,
        manifest: availableUpdate.manifest,
        createdAt: availableUpdate.createdAt,
        updateId: availableUpdate.updateId,
        runtimeVersion: availableUpdate.runtimeVersion,
      });
    } else {
      setUpdateInfo(null);
    }
  }, [availableUpdate]);
  
  // 마지막 체크 시간 업데이트
  useEffect(() => {
    if (lastCheckForUpdateTime) {
      setLastChecked(lastCheckForUpdateTime);
    }
  }, [lastCheckForUpdateTime]);
  
  // 업데이트 체크 함수
  const checkForUpdate = useCallback(async (): Promise<void> => {
    if (!canUpdate) {
      debugLog('Updates are disabled');
      return;
    }
    
    try {
      debugLog('Checking for updates...');
      logUpdateEvent('update_check_started');
      
      const userSettings = await getUserSettings();
      if (!userSettings.autoCheck) {
        debugLog('Auto check is disabled');
        return;
      }
      
      const shouldCheck = await shouldCheckForUpdates();
      if (!shouldCheck) {
        debugLog('Too soon to check for updates');
        return;
      }
      
      setStatus('checking');
      setError(null);
      
      // 재시도 로직과 함께 업데이트 체크
      const result = await retryWithBackoff(async () => {
        return await Updates.checkForUpdateAsync();
      });
      
      await setLastCheckTime();
      
      if (result.isAvailable) {
        debugLog('Update is available', result);
        logUpdateEvent('update_available', {
          updateId: result.updateId,
          runtimeVersion: result.runtimeVersion,
        });
        
        setUpdateInfo({
          isAvailable: true,
          manifest: result.manifest,
          createdAt: result.createdAt,
          updateId: result.updateId,
          runtimeVersion: result.runtimeVersion,
        });
        
        setStatus('available');
        
        // 자동 다운로드 설정이 활성화되어 있으면 다운로드 시작
        if (userSettings.autoDownload) {
          const canDownload = await canDownloadUpdate(userSettings);
          if (canDownload) {
            debugLog('Auto-downloading update...');
            await downloadUpdate();
          }
        }
      } else {
        debugLog('No update available');
        logUpdateEvent('update_not_available');
        setStatus('idle');
      }
    } catch (err) {
      const updateError = formatUpdateError(err as Error);
      setError(updateError);
      setStatus('error');
      debugLog('Check for update failed', err);
      logUpdateEvent('update_check_failed', { error: (err as Error).message });
    }
  }, [canUpdate]);
  
  // 업데이트 다운로드 함수
  const downloadUpdate = useCallback(async (): Promise<void> => {
    if (!canUpdate || !isUpdateAvailable) {
      debugLog('Cannot download update');
      return;
    }
    
    try {
      debugLog('Downloading update...');
      logUpdateEvent('update_download_started');
      
      const userSettings = await getUserSettings();
      const canDownload = await canDownloadUpdate(userSettings);
      
      if (!canDownload) {
        debugLog('Cannot download update due to network restrictions');
        return;
      }
      
      setStatus('downloading');
      setError(null);
      setDownloadProgress(0);
      
      // 다운로드 진행률 추적 (TODO: 실제 진행률 구현 필요)
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      const result = await retryWithBackoff(async () => {
        return await Updates.fetchUpdateAsync();
      });
      
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      if (result.isNew) {
        debugLog('Update downloaded successfully');
        logUpdateEvent('update_downloaded', {
          updateId: result.updateId,
          runtimeVersion: result.runtimeVersion,
        });
        setStatus('pending');
      } else {
        debugLog('Update was already downloaded');
        setStatus('pending');
      }
    } catch (err) {
      const updateError = formatUpdateError(err as Error);
      setError(updateError);
      setStatus('error');
      debugLog('Download update failed', err);
      logUpdateEvent('update_download_failed', { error: (err as Error).message });
    }
  }, [canUpdate, isUpdateAvailable]);
  
  // 업데이트 적용 함수
  const applyUpdate = useCallback(async (): Promise<void> => {
    if (!canUpdate || !isPending) {
      debugLog('Cannot apply update');
      return;
    }
    
    try {
      debugLog('Applying update...');
      logUpdateEvent('update_apply_started');
      
      await Updates.reloadAsync();
      
      logUpdateEvent('update_applied');
    } catch (err) {
      const updateError = formatUpdateError(err as Error);
      setError(updateError);
      setStatus('error');
      debugLog('Apply update failed', err);
      logUpdateEvent('update_apply_failed', { error: (err as Error).message });
    }
  }, [canUpdate, isPending]);
  
  // 업데이트 무시 함수
  const dismissUpdate = useCallback((): void => {
    debugLog('Update dismissed');
    logUpdateEvent('update_dismissed');
    setStatus('idle');
    setUpdateInfo(null);
    setError(null);
  }, []);
  
  // 앱 포그라운드 시 자동 체크
  useEffect(() => {
    if (canUpdate) {
      checkForUpdate();
    }
  }, [canUpdate, checkForUpdate]);
  
  return {
    // 상태
    status,
    isUpdateAvailable,
    isDownloading,
    isPending,
    isChecking,
    downloadProgress,
    error,
    
    // 업데이트 정보
    updateInfo,
    currentlyRunning,
    
    // 액션
    checkForUpdate,
    downloadUpdate,
    applyUpdate,
    dismissUpdate,
    
    // 유틸리티
    canUpdate,
    lastChecked,
  };
};