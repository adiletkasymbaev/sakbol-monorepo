from django.db import models

class KyrgyzstanCities(models.TextChoices):
    AYDARKEN = "aydarken", "Айдаркен"
    BALYKCHY = "balykchy", "Балыкчы"
    BATKEN = "batken", "Баткен"
    BAZAR_KORGON = "bazar_korgon", "Базар-Коргон"
    BISHKEK = "bishkek", "Бишкек"
    CHOLPON_ATA = "cholpon_ata", "Чолпон-Ата"
    GULCHO = "gulcho", "Гүлчө"
    JALAL_ABAD = "jalal_abad", "Джалал-Абад"
    KADAMJAY = "kadamjay", "Кадамжай"
    KANT = "kant", "Кант"
    KARA_BALTA = "kara_balta", "Кара-Балта"
    KARAKOL = "karakol", "Каракол"
    KARA_KOL = "kara_kol", "Кара-Көл"
    KARA_SUU = "kara_suu", "Кара-Суу"
    KAYYNGDY = "kayyn_gdy", "Кайынды"
    KEMIN = "kemin", "Кемин"
    KERBEN = "kerben", "Кербен"
    KOCHKOR_ATA = "kochkor_ata", "Кочкор-Ата"
    KOK_JANGGAK = "kok_janggak", "Көк-Жаңгак"
    KYZYL_KIYA = "kyzyl_kiya", "Кызыл-Кыя"
    MAYLUU_SUU = "mayluu_suu", "Майлуу-Суу"
    NARYN = "naryn", "Нарын"
    NOOKAT = "nookat", "Ноокат"
    ORLOVKA = "orlovka", "Орловка"
    OSH = "osh", "Ош"
    OZGON = "ozgon", "Өзгөн"
    RAZZAKOV = "razzakov", "Раззаков"
    SHOPOKOV = "shopokov", "Шопоков"
    SULUKTU = "suluktu", "Сүлүктү"
    TALAS = "talas", "Талас"
    TASH_KOMUR = "tash_komur", "Таш-Көмүр"
    TOKMOK = "tokmok", "Токмок"
    TOKTOGUL = "toktogul", "Токтогул"

class AlertStatus(models.TextChoices):
    PENDING = 'pending', 'pending'
    ANSWERED = 'answered', 'answered'
    NO_ANSWER = 'no_answer', 'no_answer'
    INACTIVE = 'inactive', 'inactive'
    RESOLVED = 'resolved', 'resolved'
    
class SosStatus(models.TextChoices):
    PENDING = 'pending', 'pending'
    ANSWERED = 'answered', 'answered'
    INACTIVE = 'inactive', 'inactive'
    RESOLVED = 'resolved', 'resolved'
    FALSE = 'false', 'false'

class ProfileRole(models.TextChoices):
    USER = 'user', 'user'
    TOUR_AGENCY = 'tour_agency', 'tour_agency'
    TOURIST = 'tourist', 'tourist'
    PARENT = 'parent', 'parent'
    CHILD = 'child', 'child'

class UserRole(models.TextChoices):
    MANAGER = 'manager', 'manager'
    HEAD = 'head', 'head'