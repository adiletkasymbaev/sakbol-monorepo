import React, { useEffect, useState } from 'react';
import { useSOSListener, useWarningListener } from '../../shared/hooks/useNative';
import { SOSData, WarningData } from '../../shared/services/nativeBridge';
import styles from './SOSNotification.module.css';

/**
 * Компонент для отображения SOS уведомлений
 * Показывает экран при срабатывании голосового SOS
 */
export const SOSNotification: React.FC = () => {
  const [sosData, setSosData] = useState<SOSData | null>(null);
  const [warningData, setWarningData] = useState<WarningData | null>(null);
  const [showSOS, setShowSOS] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Слушаем SOS события
  useSOSListener((data) => {
    setSosData(data);
    setShowSOS(true);
    
    // Для immediate SOS показываем дольше
    const duration = data.priority === 'immediate' ? 15000 : 10000;
    
    setTimeout(() => {
      setShowSOS(false);
    }, duration);
  });

  // Слушаем Warning события
  useWarningListener((data) => {
    setWarningData(data);
    setShowWarning(true);
    
    setTimeout(() => {
      setShowWarning(false);
    }, 5000);
  });

  const handleCloseSOS = () => {
    setShowSOS(false);
  };

  const handleCloseWarning = () => {
    setShowWarning(false);
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'ambulance':
        return '🚑';
      case 'police':
        return '🚔';
      case 'fire':
        return '🚒';
      default:
        return '🆘';
    }
  };

  const getServiceName = (service: string) => {
    switch (service) {
      case 'ambulance':
        return 'Скорая помощь';
      case 'police':
        return 'Полиция';
      case 'fire':
        return 'Пожарная служба';
      default:
        return 'Экстренная служба';
    }
  };

  return (
    <>
      {/* SOS Modal */}
      {showSOS && sosData && (
        <div className={`${styles.overlay} ${sosData.priority === 'immediate' ? styles.immediate : ''}`}>
          <div className={styles.modal}>
            <div className={styles.icon}>
              {getServiceIcon(sosData.service)}
            </div>
            
            <h2 className={styles.title}>
              {sosData.priority === 'immediate' 
                ? '🆘 ЭКСТРЕННЫЙ ВЫЗОВ ОТПРАВЛЕН!' 
                : '🚨 Вызов экстренных служб отправлен'}
            </h2>
            
            <div className={styles.details}>
              <p className={styles.service}>
                <strong>Служба:</strong> {getServiceName(sosData.service)}
              </p>
              
              <p className={styles.words}>
                <strong>Распознанные слова:</strong>
                <span className={styles.wordsList}>
                  {sosData.words.join(', ')}
                </span>
              </p>
              
              <p className={styles.time}>
                <strong>Время:</strong> {new Date(sosData.timestamp).toLocaleTimeString()}
              </p>

              {sosData.priority === 'immediate' && (
                <p className={styles.immediateNotice}>
                  ⚡ Немедленный вызов активирован
                </p>
              )}
            </div>
            
            <button 
              className={styles.closeButton}
              onClick={handleCloseSOS}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Warning Toast */}
      {showWarning && warningData && (
        <div className={styles.warningToast}>
          <div className={styles.warningContent}>
            <span className={styles.warningIcon}>⚠️</span>
            <div className={styles.warningText}>
              <strong>Предупреждение:</strong>
              <span>"{warningData.word}"</span>
            </div>
            <button 
              className={styles.warningClose}
              onClick={handleCloseWarning}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SOSNotification;
