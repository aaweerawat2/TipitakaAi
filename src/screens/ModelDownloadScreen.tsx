/**
 * Model Download Screen
 * หน้าดาวน์โหลด AI models
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, Check, Trash2, Wifi, HardDrive, Cpu } from 'lucide-react-native';

interface ModelStatus {
  id: string;
  name: string;
  size: number;
  required: boolean;
  installed: boolean;
  isDownloading: boolean;
  progress?: {
    progress: number;
    downloadedMB: number;
    totalMB: number;
    status: string;
  };
}

const ModelDownloadScreen: React.FC = () => {
  const [models, setModels] = useState<ModelStatus[]>([
    {
      id: 'llm',
      name: 'Llama 3.2 1B (Thai)',
      size: 620,
      required: true,
      installed: false,
      isDownloading: false,
    },
    {
      id: 'asr',
      name: 'Whisper Thai (ASR)',
      size: 244,
      required: true,
      installed: false,
      isDownloading: false,
    },
    {
      id: 'tts',
      name: 'Thai TTS (VITS)',
      size: 50,
      required: false,
      installed: false,
      isDownloading: false,
    },
    {
      id: 'qnn',
      name: 'QNN Runtime',
      size: 30,
      required: true,
      installed: false,
      isDownloading: false,
    },
  ]);
  const [htpAvailable, setHtpAvailable] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const totalSize = models.reduce((sum, m) => sum + m.size, 0);
  const installedCount = models.filter(m => m.installed).length;

  const handleDownload = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    if (model.installed) {
      Alert.alert(
        'Model Installed',
        'This model is already installed.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Simulate download
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, isDownloading: true } : m
    ));

    // Simulate progress
    setTimeout(() => {
      setModels(prev => prev.map(m => 
        m.id === modelId 
          ? { ...m, installed: true, isDownloading: false } 
          : m
      ));
      Alert.alert('Success', `${model.name} downloaded successfully!`);
    }, 2000);
  };

  const handleDelete = (modelId: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to delete this model?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setModels(prev => prev.map(m => 
              m.id === modelId ? { ...m, installed: false } : m
            ));
          },
        },
      ]
    );
  };

  const handleDownloadAll = () => {
    const notInstalled = models.filter(m => !m.installed && !m.isDownloading);
    
    if (notInstalled.length === 0) {
      Alert.alert('All Models Installed', 'All models are already installed.');
      return;
    }

    Alert.alert(
      'Download All Models',
      `This will download ${notInstalled.length} models (${totalSize} MB). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            setDownloadingAll(true);
            setTimeout(() => {
              setModels(prev => prev.map(m => ({ ...m, installed: true, isDownloading: false })));
              setDownloadingAll(false);
              Alert.alert('Success', 'All models downloaded!');
            }, 5000);
          },
        },
      ]
    );
  };

  const renderModel = (model: ModelStatus) => {
    const isDownloading = model.isDownloading;

    return (
      <View key={model.id} style={styles.modelCard}>
        <View style={styles.modelHeader}>
          <View style={styles.modelInfo}>
            <Text style={styles.modelName}>{model.name}</Text>
            <Text style={styles.modelSize}>{model.size} MB</Text>
            {model.required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </View>

          {model.installed ? (
            <View style={styles.installedBadge}>
              <Check size={16} color="#10B981" />
              <Text style={styles.installedText}>Installed</Text>
            </View>
          ) : isDownloading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : null}
        </View>

        {isDownloading && model.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${model.progress.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {model.progress.status === 'extracting' 
                ? 'Extracting...' 
                : `${model.progress.downloadedMB} / ${model.progress.totalMB} MB`
              }
            </Text>
          </View>
        )}

        <View style={styles.modelActions}>
          {!model.installed && !isDownloading && (
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => handleDownload(model.id)}
            >
              <Download size={18} color="white" />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          )}

          {model.installed && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDelete(model.id)}
            >
              <Trash2 size={18} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Models</Text>
          <Text style={styles.subtitle}>
            Download AI models for offline use
          </Text>
        </View>

        <View style={styles.deviceInfo}>
          <View style={styles.infoItem}>
            <Cpu size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Backend: {htpAvailable ? 'HTP (NPU)' : 'CPU'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <HardDrive size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              {installedCount}/{models.length} models installed
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Wifi size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Total size: {totalSize} MB
            </Text>
          </View>
        </View>

        {htpAvailable && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ✅ Snapdragon NPU detected! AI will run 5x faster with HTP acceleration.
            </Text>
          </View>
        )}

        <View style={styles.modelsList}>
          {models.map(renderModel)}
        </View>

        <TouchableOpacity 
          style={[
            styles.downloadAllButton,
            downloadingAll && styles.downloadAllButtonDisabled
          ]}
          onPress={handleDownloadAll}
          disabled={downloadingAll}
        >
          {downloadingAll ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Download size={20} color="white" />
              <Text style={styles.downloadAllButtonText}>Download All Models</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ Models will be downloaded to your device storage. 
            Make sure you have enough space and a stable WiFi connection.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  deviceInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
  },
  notice: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    color: '#059669',
    fontSize: 14,
  },
  modelsList: {
    marginBottom: 24,
  },
  modelCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modelSize: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  requiredBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  requiredText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  installedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  installedText: {
    marginLeft: 4,
    color: '#10B981',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  modelActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  downloadAllButtonDisabled: {
    opacity: 0.7,
  },
  downloadAllButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  warning: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default ModelDownloadScreen;
