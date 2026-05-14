import React, { useState, useEffect } from 'react';
import { useNative } from '../../shared/hooks/useNative';
import styles from './NativeSettings.module.css';

/**
 * Компонент настроек нативного Android приложения
 * Позволяет пользователю управлять:
 * - Уведомлениями (foreground service)
 * - Геолокацией
 * - Голосовым распознаванием
 */
export const NativeSettings: React.FC = () => {
  const {
    isNative,
    permissions,
    isLocationActive,
    enableNotifications,
    disableNotifications,
    requestLocationPermission,
    pauseVoiceListening,
    resumeVoiceListening,
    refreshPermissions,
  } = useNative();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Если не нативное приложение - не показываем настройки
  if (!isNative) {
    return (
      <div className={styles.container}>
        <p className={styles.info}>
          Настройки нативного приложения доступны только в мобильном приложении Sakbol
        </p>
      </div>
    );
  }

  const handleToggleNotifications = () => {
    if (notificationsEnabled) {
      disableNotifications();
      setNotificationsEnabled(false);
    } else {
      enableNotifications();
      setNotificationsEnabled(true);
    }
  };

  const handleRequestLocation = () => {
    requestLocationPermission();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Настройки приложения</h2>

      {/* Раздел разрешений */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Разрешения</h3>
        
        <div className={styles.permissionItem}>
          <span className={styles.permissionLabel}>Микрофон</span>
          <span className={permissions?.microphone ? styles.granted : styles.denied}>
            {permissions?.microphone ? '✓ Разрешено' : '✗ Не разрешено'}
          </span>
        </div>

        <div className={styles.permissionItem}>
          <span className={styles.permissionLabel}>Уведомления</span>
          <span className={permissions?.notifications ? styles.granted : styles.denied}>
            {permissions?.notifications ? '✓ Разрешено' : '✗ Не разрешено'}
          </span>
        </div>

        <div className={styles.permissionItem}>
          <span className={styles.permissionLabel}>Геолокация</span>
          <span className={permissions?.fineLocation ? styles.granted : styles.denied}>
            {permissions?.fineLocation ? '✓ Разрешено' : '✗ Не разрешено'}
          </span>
        </div>

        <button 
          className={styles.refreshButton}
          onClick={refreshPermissions}
        >
          Обновить статус
        </button>
      </div>

      {/* Раздел голосового SOS */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Голосовой SOS</h3>
        <p className={styles.description}>
          Приложение слушает ключевые слова и автоматически отправляет сигнал SOS
        </p>

        <div className={styles.toggleRow}>
          <span>Показывать уведомление</span>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleToggleNotifications}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.buttonRow}>
          <button 
            className={styles.controlButton}
            onClick={pauseVoiceListening}
          >
            Пауза
          </button>
          <button 
            className={styles.controlButton}
            onClick={resumeVoiceListening}
          >
            Слушать
          </button>
        </div>
      </div>

      {/* Раздел геолокации */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Геолокация</h3>
        <p className={styles.description}>
          Отправка координат для экстренных вызовов
        </p>

        <div className={styles.statusRow}>
          <span>Статус:</span>
          <span className={isLocationActive ? styles.active : styles.inactive}>
            {isLocationActive ? 'Активна' : 'Неактивна'}
          </span>
        </div>

        {!permissions?.fineLocation && (
          <button 
            className={styles.actionButton}
            onClick={handleRequestLocation}
          >
            Разрешить доступ к геолокации
          </button>
        )}
      </div>

      {/* Информация о ключевых словах */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Ключевые слова для SOS</h3>
        
        <div className={styles.keywordGroup}>
          <h4>Немедленный вызов:</h4>
          <p className={styles.keywords}>
            SOS, помощь, вызывайте, вызовите
          </p>
        </div>

        <div className={styles.keywordGroup}>
          <h4>Скорая помощь:</h4>
          <p className={styles.keywords}>
            скорая, скорую, больной, плохо, врач
          </p>
        </div>

        <div className={styles.keywordGroup}>
          <h4>Полиция:</h4>
          <p className={styles.keywords}>
            полиция, милиция, преступление, грабитель
          </p>
        </div>

        <div className={styles.keywordGroup}>
          <h4>Пожарные:</h4>
          <p className={styles.keywords}>
            пожар, горит, огонь, пламя, дым
          </p>
        </div>

        <div className={styles.keywordGroup}>
          <h4>Предупреждения:</h4>
          <p className={styles.keywords}>
            всё готово, чай остыл, ключи у тебя, пора домой, уже выехала
          </p>
        </div>
      </div>
    </div>
  );
};

export default NativeSettings;
