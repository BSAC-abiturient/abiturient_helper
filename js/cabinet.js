const { useState, useEffect } = React;

// Списки специальностей для динамического выбора в зависимости от уровня и базы
const specialtiesDatabase = {
    sso: {
        '9cl': [
            "Разработка и сопровождение веб-ресурсов",
            "Техническая эксплуатация систем и сетей телекоммуникаций",
            "Информационные кабельные сети",
            "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения",
            "Техническая эксплуатация мультимедийных систем",
            "Почтовая деятельность",
            "Тестирование программного обеспечения"
        ],
        '11cl': [
            "Техническая эксплуатация систем и сетей телекоммуникаций (Дневное)",
            "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения (Дневное)",
            "Почтовая деятельность (Дневное)",
            "Тестирование программного обеспечения (Дневное)",
            "Техническая эксплуатация систем и сетей телекоммуникаций (Заочное)",
            "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения (Заочное)",
            "Почтовая деятельность (Заочное)"
        ],
        'pto': [
            "Почтовая деятельность"
        ]
    },
    vo: {
        '11cl': [
            "Автоматизация технологических процессов и производств",
            "Системы и сети инфокоммуникаций",
            "Прикладная информатика",
            "Цифровые клиентские сервисы и почтово-логистические системы",
            "Маркетинг"
        ],
        'sso_short': [
            "Системы и сети инфокоммуникаций (Дневное сокращенное)",
            "Прикладная информатика (Дневное сокращенное)",
            "Почтовая связь (Дневное сокращенное)",
            "Системы и сети инфокоммуникаций (Заочное сокращенное)",
            "Прикладная информатика (Заочное сокращенное)",
            "Почтовая связь (Заочное сокращенное)"
        ]
    }
};

const specialtyMetadataLocal = {
    sso9: {
        educationForm: "Дневная",
        base: "9 классов",
        duration: {
            "Разработка и сопровождение веб-ресурсов": "3 г. 10 мес.",
            "Техническая эксплуатация систем и сетей телекоммуникаций": "3 г. 10 мес.",
            "Информационные кабельные сети": "3 г. 10 мес.",
            "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения": "3 г. 10 мес.",
            "Техническая эксплуатация мультимедийных систем": "3 г. 10 мес.",
            "Тестирование программного обеспечения": "3 года",
            "Почтовая деятельность": "3 года"
        }
    },
    sso11: {
        dnev: {
            educationForm: "Дневная",
            base: "11 классов",
            duration: {
                "Техническая эксплуатация систем и сетей телекоммуникаций": "2 г. 10 мес.",
                "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения": "2 г. 10 мес.",
                "Тестирование программного обеспечения": "2 года",
                "Почтовая деятельность": "2 года"
            }
        },
        zaoch: {
            educationForm: "Заочная",
            base: "11 классов",
            duration: {
                "Техническая эксплуатация систем и сетей телекоммуникаций": "3 г. 10 мес.",
                "Техническая эксплуатация систем радиосвязи, радиовещания и телевидения": "3 г. 10 мес.",
                "Почтовая деятельность": "3 года"
            }
        }
    },
    ssopto: {
        educationForm: "Дневная",
        base: "ПТО",
        duration: {
            "Почтовая деятельность": "2 года"
        }
    },
    vo11: {
        educationForm: "Дневная",
        base: "11 классов",
        duration: "4 года"
    },
    vosso: {
        dnev: {
            educationForm: "Дневная сокр.",
            base: "ССО",
            duration: {
                "Системы и сети инфокоммуникаций": "2,5 года",
                "Прикладная информатика": "2,5 года",
                "Почтовая связь": "3 года"
            }
        },
        zaoch: {
            educationForm: "Заочная сокр.",
            base: "ССО",
            duration: {
                "Системы и сети инфокоммуникаций": "3 года",
                "Прикладная информатика": "3 года",
                "Почтовая связь": "3,5 года"
            }
        }
    }
};

function PersonalCabinet({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('checklist');

    // Настройки Чек-листа
    const [level, setLevel] = useState(() => localStorage.getItem('chk_level') || 'sso');
    const [isMinor, setIsMinor] = useState(() => localStorage.getItem('chk_is_minor') || 'no');
    const [form, setForm] = useState(() => localStorage.getItem('chk_form') || 'dnev');
    const [checkedItems, setCheckedItems] = useState(() => {
        const saved = localStorage.getItem('chk_checked_items');
        return saved ? JSON.parse(saved) : {};
    });

    // Состояние авторизованного пользователя
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('cab_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // СОСТОЯНИЯ УМНЫХ РЕКОМЕНДАЦИЙ (ТЕПЕРЬ НАХОДЯТСЯ СТРОГО ВНУТРИ ФУНКЦИИ)
    const [recommendations, setRecommendations] = useState([]);
    const [showRecBanner, setShowRecBanner] = useState(false);
    const [recLoading, setRecLoading] = useState(false);

    // Отдельное окно регистрации
    const [isRegWindowOpen, setIsRegWindowOpen] = useState(false);
    const [regStep, setRegStep] = useState(1);
    const [regLoading, setRegLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);

    // Поля формы регистрации
    const [regEmail, setRegEmail] = useState('');
    const [regLevel, setRegLevel] = useState('sso');
    const [regBase, setRegBase] = useState('9cl');
    const [regScore, setRegScore] = useState('');
    const [regSpecialty, setRegSpecialty] = useState('');
    const [regOtp, setRegOtp] = useState('');

    // Состояния Избранного и Сравнения
    const [favorites, setFavorites] = useState([]);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [checkedCompare, setCheckedCompare] = useState([]); // Сравниваемые специальности
    const [comparisonData, setComparisonData] = useState([]); // Результаты запросов из бэкенда
    const [isCompareWindowOpen, setIsCompareWindowOpen] = useState(false);
    const [compareLoading, setCompareLoading] = useState(false);

    // Состояния интерактивного теста-навигатора
    const [quizStep, setQuizStep] = useState(1);
    const [targetLevel, setTargetLevel] = useState('');
    const [targetForm, setTargetForm] = useState('dnev');
    const [currentTestKey, setCurrentTestKey] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizScores, setQuizScores] = useState({});
    const [answersHistory, setAnswersHistory] = useState([]);

    const API_URL = 'https://narxselune-bsac-backend.hf.space/api/specialties';

    // Функция-санитайзер для автоматического исправления старых ссылок из БД
    const getSanitizedUrl = (item) => {
        const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
        const pathPrefix = isRoot ? 'pages/' : '../';
        return `${pathPrefix}monitoring/specialty.html?level=${item.level}&form=${item.form}&name=${encodeURIComponent(item.name)}`;
    };

    // ==========================================================================
    // ФУНКЦИЯ СИНХРОНИЗАЦИИ С БЭКЕНДОМ
    // ==========================================================================
    const syncDataWithStrapi = async (updatedChecklist, updatedFavorites) => {
        const jwt = localStorage.getItem('cab_jwt');
        if (!jwt || !user) return;

        try {
            await fetch(`${STRAPI_URL}/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    checklist_data: updatedChecklist,
                    favorites_data: updatedFavorites
                })
            });
        } catch (e) {
            console.warn("Сетевой сбой при синхронизации со Strapi:", e);
        }
    };

    // Эффект закрытия окна при клике мимо Личного Кабинета
    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (e) => {
            const cabinetEl = document.querySelector('.cabinet-window');
            const toggleBtnEl = document.querySelector('.cabinet-toggle-btn');

            if (
                cabinetEl && !cabinetEl.contains(e.target) &&
                (!toggleBtnEl || !toggleBtnEl.contains(e.target))
            ) {
                onClose();
            }
        };

        document.addEventListener('click', handleOutsideClick, true);
        document.addEventListener('touchstart', handleOutsideClick, { capture: true, passive: true });

        return () => {
            document.removeEventListener('click', handleOutsideClick, true);
            document.removeEventListener('touchstart', handleOutsideClick, true);
        };
    }, [isOpen, onClose]);

    // Эффект синхронизации Избранного с localStorage
    useEffect(() => {
        const handleUpdate = () => {
            const favs = JSON.parse(localStorage.getItem('favorites_specs')) || [];
            setFavorites(favs);
            if (user) {
                syncDataWithStrapi(checkedItems, favs);
            }
        };
        window.addEventListener('favoritesUpdated', handleUpdate);
        handleUpdate();
        return () => window.removeEventListener('favoritesUpdated', handleUpdate);
    }, [user]);

    // Эффект для автоматической проверки рекомендаций при авторизации пользователя
    useEffect(() => {
        if (!user) {
            setShowRecBanner(false);
            setRecommendations([]);
            return;
        }

        const fetchRecommendations = async () => {
            setRecLoading(true);
            try {
                const response = await fetch(`${STRAPI_URL}/api/auth/recommendations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        score: user.score,
                        education_level: user.education_level,
                        submitted_specialty: user.submitted_specialty
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    setShowRecBanner(data.showBanner);
                    setRecommendations(data.recommendations || []);
                }
            } catch (e) {
                console.warn("Ошибка при получении умных подсказок:", e);
            } finally {
                setRecLoading(false);
            }
        };

        fetchRecommendations();
    }, [user]);

    // Эффект смены баз при изменении уровня образования на форме регистрации
    useEffect(() => {
        if (regLevel === 'sso') {
            setRegBase('9cl');
        } else {
            setRegBase('11cl');
        }
    }, [regLevel]);

    // Эффект смены специальности при изменении уровня или базы на форме регистрации
    useEffect(() => {
        const specs = specialtiesDatabase[regLevel]?.[regBase] || [];
        setRegSpecialty(specs[0] || '');
    }, [regLevel, regBase]);

    // Таймер обратного отсчета для повторной отправки OTP
    useEffect(() => {
        let interval = null;
        if (isRegWindowOpen && regStep === 2 && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRegWindowOpen, regStep, resendTimer]);

    useEffect(() => {
        localStorage.setItem('chk_level', level);
        localStorage.setItem('chk_is_minor', isMinor);
        localStorage.setItem('chk_form', form);
    }, [level, isMinor, form]);

    useEffect(() => {
        localStorage.setItem('chk_checked_items', JSON.stringify(checkedItems));
    }, [checkedItems]);

    if (!isOpen) return null;

    const handleCheckboxChange = (id) => {
        setCheckedItems(prev => {
            const updated = { ...prev, [id]: !prev[id] };
            localStorage.setItem('chk_checked_items', JSON.stringify(updated));
            if (user) {
                syncDataWithStrapi(updated, favorites);
            }
            return updated;
        });
    };

    const handleScoreChange = (e) => {
        let val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
        const numeric = parseFloat(val);

        if (regLevel === 'sso') {
            const dotIndex = val.indexOf('.');
            if (dotIndex !== -1) {
                const integerPart = val.substring(0, dotIndex);
                let fractionalPart = val.substring(dotIndex + 1).replace(/\./g, '');
                if (fractionalPart.length > 1) {
                    fractionalPart = fractionalPart.substring(0, 1);
                }
                val = integerPart + '.' + fractionalPart;
            }
            if (!isNaN(numeric) && numeric > 10) val = '10';
        } else {
            val = val.replace('.', '');
            const maxScore = regBase === 'sso_short' ? 300 : 400;
            if (!isNaN(numeric) && numeric > maxScore) val = maxScore.toString();
        }
        setRegScore(val);
    };

    const handleRegisterSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!regEmail.trim() || !regScore.trim() || !regSpecialty) {
            alert('Пожалуйста, заполните все поля формы');
            return;
        }

        setRegLoading(true);
        try {
            const response = await fetch(`${STRAPI_URL}/api/auth/otp-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: regEmail,
                    education_level: regLevel,
                    education_base: regBase,
                    score: regScore,
                    submitted_specialty: regSpecialty
                })
            });

            const data = await response.json();
            if (response.ok) {
                setResendTimer(60);
                setRegStep(2);
            } else {
                alert(data.error?.message || 'Не удалось отправить запрос на регистрацию');
            }
        } catch (err) {
            alert('Ошибка соединения с сервером авторизации');
        } finally {
            setRegLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0) return;
        await handleRegisterSubmit(null);
        alert('Новый код подтверждения отправлен на вашу почту');
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!regOtp.trim()) return;

        setRegLoading(true);
        try {
            const response = await fetch(`${STRAPI_URL}/api/auth/otp-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: regEmail, code: regOtp })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('cab_jwt', data.jwt);
                localStorage.setItem('cab_user', JSON.stringify(data.user));
                setUser(data.user);

                if (data.user.checklist_data) {
                    setCheckedItems(data.user.checklist_data);
                    localStorage.setItem('chk_checked_items', JSON.stringify(data.user.checklist_data));
                }
                if (data.user.favorites_data) {
                    setFavorites(data.user.favorites_data);
                    localStorage.setItem('favorites_specs', JSON.stringify(data.user.favorites_data));
                    window.dispatchEvent(new Event('favoritesUpdated'));
                }

                setIsRegWindowOpen(false);
                setRegStep(1);
                setRegEmail('');
                setRegScore('');
                setRegOtp('');
                alert('Регистрация и верификация успешно завершены!');
            } else {
                alert(data.error?.message || 'Неверный код подтверждения');
            }
        } catch (err) {
            alert('Ошибка верификации кода');
        } finally {
            setRegLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('cab_jwt');
        localStorage.removeItem('cab_user');
        setUser(null);
    };

    const removeFavoriteItem = (item) => {
        let favs = JSON.parse(localStorage.getItem('favorites_specs')) || [];
        favs = favs.filter(f => !(f.name === item.name && f.level === item.level && f.form === item.form && f.category === item.category));
        localStorage.setItem('favorites_specs', JSON.stringify(favs));
        window.dispatchEvent(new Event('favoritesUpdated'));
    };

    const handleCompareCheckboxChange = (item) => {
        setCheckedCompare(prev => {
            const exists = prev.some(f => f.name === item.name && f.level === item.level && f.form === item.form && f.category === item.category);
            if (exists) {
                return prev.filter(f => !(f.name === item.name && f.level === item.level && f.form === item.form && f.category === item.category));
            } else {
                return [...prev, item];
            }
        });
    };

    const startComparison = async () => {
        if (checkedCompare.length < 2) return;
        setCompareLoading(true);
        setIsCompareWindowOpen(true);

        try {
            let compiledResults = [];

            for (const item of checkedCompare) {
                const specRes = await fetch(`${STRAPI_URL}/api/specialties?filters[name][$eq]=${encodeURIComponent(item.name)}&filters[education_level][$eq]=${item.level}&filters[form_of_study][$eq]=${item.form}&filters[category][$eq]=${item.category}`);
                const specJson = await specRes.json();

                // Безопасное извлечение свойств без опциональной цепочки
                const specAttributes = specJson && specJson.data && specJson.data[0] ? (specJson.data[0].attributes || specJson.data[0]) : null;

                const archRes = await fetch(`${STRAPI_URL}/api/archives?filters[specialty_name][$eq]=${encodeURIComponent(item.name)}&filters[category][$eq]=${item.category}`);
                const archJson = await archRes.json();

                const archRecord = archJson && archJson.data ? archJson.data.find(rec => {
                    const attributes = rec.attributes || rec;
                    let archLevel = 'sso9';
                    for (const key in attributes) {
                        const val = String(attributes[key]).toLowerCase().trim();
                        if (['sso9', 'sso11', 'ssopto', 'vo11', 'vosso'].includes(val)) {
                            archLevel = val;
                        }
                    }
                    return archLevel === item.level;
                }) : null;

                const archScore = archRecord ? (archRecord.attributes?.score || archRecord.score) : "—";

                let meta = specialtyMetadataLocal[item.level] || {};
                if (item.level === 'sso11' || item.level === 'vosso') {
                    meta = meta[item.form] || {};
                }

                const duration = typeof meta.duration === 'object' ? (meta.duration[item.name] || "3 года") : (meta.duration || "4 года");
                const formLabel = item.form === 'zaoch' ? 'Заочная' : 'Дневная';
                const categoryLabel = item.category === 'budget' ? 'Бюджет' : 'Платно';

                let livePassingScore = "—";
                let competitionRatio = "0.00";

                if (specAttributes && specAttributes.plan > 0) {
                    const plan = specAttributes.plan;
                    const totalApps = specAttributes.total_applications || 0;
                    competitionRatio = (totalApps / plan).toFixed(2);

                    // БЕЗОПАСНЫЙ РАЗБОР РАСПРЕДЕЛЕНИЯ ИЗ БАЗЫ STRAPI
                    let rawDist = specAttributes.applications_distribution || {};
                    if (typeof rawDist === 'string') {
                        try {
                            rawDist = JSON.parse(rawDist);
                        } catch (e) {
                            rawDist = {};
                        }
                    }

                    // Берем массив общего конкурса (или резервный пустой массив)
                    const commonList = rawDist.common || rawDist || [];

                    let allScores = [];
                    if (Array.isArray(commonList)) {
                        commonList.forEach(dist => {
                            const countVal = parseInt(dist.count, 10) || 0;
                            const scoreVal = parseFloat(dist.score);
                            for (let i = 0; i < countVal; i++) {
                                allScores.push(scoreVal);
                            }
                        });
                    }
                    allScores.sort((a, b) => b - a);

                    if (allScores.length > 0) {
                        if (allScores.length < plan) {
                            livePassingScore = `${allScores[allScores.length - 1]}* (свободно)`;
                        } else {
                            livePassingScore = `${allScores[plan - 1]}`;
                        }
                    }
                }

                compiledResults.push({
                    name: item.name,
                    levelLabel: item.level.startsWith('vo') ? 'ВО' : 'ССО',
                    baseLabel: meta.base || "—",
                    formLabel,
                    categoryLabel,
                    duration,
                    plan: specAttributes ? specAttributes.plan : "—",
                    totalApps: specAttributes ? specAttributes.total_applications : 0,
                    competitionRatio,
                    archScore,
                    livePassingScore
                });
            }

            setComparisonData(compiledResults);
        } catch (e) {
            console.error(e);
            alert('Ошибка при загрузке данных для сравнения');
            setIsCompareWindowOpen(false);
        } finally {
            setCompareLoading(false);
        }
    };

    const getRequiredDocuments = () => {
        const docs = [
            { id: 'photos', text: '6 цветных фотографий размером 3х4 см' },
            { id: 'edu_docs', text: 'ОРИГИНАЛЫ и копии всех документов об образовании и приложения к ним (свидетельство о базовом образовании, аттестат, диплом с приложением)' },
            { id: 'medical', text: 'Медицинская справка о состоянии здоровья по форме, установленной Министерством здравоохранения, с указанием годности к выбранным специальностям (указывается полное наименование специальностей)' },
            { id: 'benefits', text: 'Документы, подтверждающие право абитуриента на льготы (при их наличии) (оригинал и копия)' },
            { id: 'vkk_mrek', text: 'Заключение ВКК или МРЭК об отсутствии противопоказаний для обучения по выбранной специальности (для детей-инвалидов до 18 лет, инвалидов I, II и III группы)' },
            { id: 'marriage', text: 'Копия свидетельства о браке (если документ об образовании и паспорт на разные фамилии)' },
            { id: 'passport', text: 'Паспорт или заменяющий его документ (предъявляется абитуриентом лично приемной комиссии)' }
        ];

        if (level === 'sso') {
            if (form === 'zaoch') {
                docs.push({ id: 'work_book_sso', text: 'Выписка (копия) из трудовой книжки, заверенная администрацией (для поступающих на заочную форму обучения)' });
            }
        } else if (level === 'vo_full') {
            docs.push({ id: 'ce_ct_vo', text: 'Оригиналы и копии сертификатов централизованного экзамена (ЦЭ) / централизованного тестирования (ЦТ)' });
            docs.push({ id: 'med_group_vo', text: 'В медицинской справке при поступлении на группу специальностей указываются все специальности группы' });
            docs.push({ id: 'char_vo', text: 'Характеристика (необходима тем, кто окончил учреждение образования в год поступления)' });
        } else if (level === 'vo_short') {
            docs.push({ id: 'char_vo_short', text: 'Характеристика (необходима тем, кто окончил учреждение образования в год поступления)' });
            if (form === 'zaoch') {
                docs.push({ id: 'work_book_vo_short', text: 'Выписка (копия) из трудовой книжки, заверенная администрацией (для поступающих на заочную форму обучения)' });
            }
        }

        if (isMinor === 'yes') {
            docs.push({ id: 'parent_presence', text: 'Подача документов в присутствии законного представителя с его паспортом (для несовершеннолетних абитуриентов)' });
        }

        return docs;
    };

    const quizDatabases = {
        sso9: [
            {
                question: "1. Представь свой идеальный рабочий день после выпуска. Чем из этого тебе хотелось бы заниматься на работе?",
                options: [
                    { text: "Писать код, верстать интерфейсы сайтов и делать удобные веб-сервисы", scores: { web: 1 } },
                    { text: "Запускать готовые программы, искать в них уязвимости, баги и тестировать их на прочность", scores: { po: 1 } },
                    { text: "Конфигурировать серверы, настраивать роутеры и защищать сети от хакерских атак", scores: { telecom: 1 } },
                    { text: "Управлять видеомикшером на ТВ-студии, настраивать концертный звук и световые спецэффекты", scores: { multi: 1 } }
                ]
            },
            {
                question: "2. Какую практическую инженерную задачу тебе было бы интереснее всего решить самостоятельно?",
                options: [
                    { text: "Сварить поврежденный волоконно-оптический кабель (ВОЛС), вернув интернет во весь микрорайон", scores: { cable: 1 } },
                    { text: "Настроить базовую станцию сотового оператора, чтобы в лесу и на трассе стабильно ловил 4G", scores: { radio: 1 } },
                    { text: "Разработать оптимальный маршрут доставки посылок из Китая, сократив время пути вдвое", scores: { post: 1 } },
                    { text: "Интегрировать датчики системы «Умный дом» с единым пультом управления квартиры", scores: { telecom: 1, cable: 1 } }
                ]
            },
            {
                question: "3. Произошел критический сбой в системе. Расследование какого инцидента тебя бы увлекло?",
                options: [
                    { text: "Крупный интернет-магазин перестал принимать оплату из-за ошибки в коде базы данных", scores: { web: 1 } },
                    { text: "Мобильное приложение банка внезапно закрывается при входе — нужно срочно найти баг", scores: { po: 1 } },
                    { text: "На телевизионной вышке пропал цифровой сигнал вещания из-за помех на частоте", scores: { radio: 1 } },
                    { text: "Сбой в базе данных отправлений — нужно восстановить адреса посылок на складе", scores: { post: 1 } }
                ]
            },
            {
                question: "4. С какими профессиональными инструментами тебе хотелось бы работать каждый день?",
                options: [
                    { text: "Среды программирования (VS Code, Git, веб-инспекторы и базы данных SQL)", scores: { web: 1 } },
                    { text: "Оптические рефлектометры, сварочные аппараты для оптоволокна и кабельные тестеры", scores: { cable: 1 } },
                    { text: "Профессиональные звуковые пульты, видеокамеры, акустические системы и софт для монтажа", scores: { multi: 1 } },
                    { text: "Консоль администрирования Linux, сетевые симуляторы и коммутаторы связи", scores: { telecom: 1 } }
                ]
            },
            {
                question: "5. Какая сфера деятельности, помимо чистого ИТ, привлекает тебя больше всего?",
                options: [
                    { text: "Шоу-бизнес, медиаиндустрия, видеопроизводство и организация трансляций", scores: { multi: 1 } },
                    { text: "Беспроводная сотовая телефония, спутниковая связь и радиолокация", scores: { radio: 1 } },
                    { text: "Электронная коммерция (e-commerce), управление потоками заказов и работа с клиентами", scores: { post: 1 } },
                    { text: "Проектирование и монтаж систем безопасности, видеонаблюдения и кабельных сетей связи", scores: { cable: 1 } }
                ]
            },
            {
                question: "6. Представь, что тебя пригласили на техническую ИТ-конференцию. Какой доклад ты послушаешь в первую очередь?",
                options: [
                    { text: "Тренды UI/UX дизайна, новые стандарты CSS и реактивный фронтенд на JavaScript", scores: { web: 2 } },
                    { text: "Как автоматизировать регрессионное тестирование и сократить баги в релизах крупных ИТ-компаний", scores: { po: 2 } },
                    { text: "Проектирование и развертывание защищенных локальных сетей в современных офисных центрах", scores: { telecom: 2 } },
                    { text: "Технологии трехмерного позиционирования звука и инсталляция студийных аудиосистем", scores: { multi: 2 } }
                ]
            },
            {
                question: "7. Тематика какой курсовой или исследовательской работы вызывает у тебя наибольший интерес?",
                options: [
                    { text: "Монтаж и эксплуатация оптических распределительных сетей в условиях плотной застройки", scores: { cable: 2 } },
                    { text: "Исследование зон затухания сигналов и электромагнитной совместимости в цифровом вещании", scores: { radio: 2 } },
                    { text: "Оптимизация работы почтового отделения связи и систем проведения денежных переводов", scores: { post: 2 } },
                    { text: "Разработка адаптивного веб-портала с использованием современных СУБД", scores: { web: 2 } }
                ]
            },
            {
                question: "8. Какое хобби или прикладное занятие приносит тебе наибольшее удовольствие вне учебы?",
                options: [
                    { text: "Изучать работу сетей, конфигурировать домашние накопители данных и домашние роутеры", scores: { telecom: 2 } },
                    { text: "Снимать контент, монтировать видео, работать с аудиодорожками и настраивать микрофоны", scores: { multi: 2 } },
                    { text: "Организовывать мероприятия, координировать процессы доставки, сборки заказов или логистики", scores: { post: 2 } },
                    { text: "Собирать электрические схемы, работать паяльником и разбираться в платах или кабелях", scores: { cable: 1, radio: 1 } }
                ]
            },
            {
                question: "9. Какая открытая вакансия на рынке труда привлекла бы твое внимание больше всего?",
                options: [
                    { text: "Тестировщик ПО (Junior QA-инженер) — контроль качества мобильных игр и веб-приложений", scores: { po: 2 } },
                    { text: "Специалист по проектированию и монтажу систем безопасности и СКС", scores: { cable: 2 } },
                    { text: "Помощник администратора сетей передачи данных / Младший системный администратор", scores: { telecom: 2 } },
                    { text: "Инженер по эксплуатации оборудования на радиоцентре или телецентре", scores: { radio: 2 } }
                ]
            }
        ],
        sso11: [
            {
                question: "1. Какая профессиональная деятельность ИТ-отдела крупной компании тебе ближе всего по духу?",
                options: [
                    { text: "Обеспечение качества выпускаемых программ: от написания автотестов до ручной проверки сценариев", scores: { po: 1 } },
                    { text: "Сетевое администрирование: распределение IP-адресов, настройка VPN-каналов и маршрутизаторов", scores: { telecom: 1 } },
                    { text: "Радиотехника: расчет зон покрытия вышек связи, борьба с помехами радиоэфира", scores: { radio: 1 } },
                    { text: "Операционный менеджмент: организация работы почтовых хабов, кассовых операций и логистики", scores: { post: 1 } }
                ]
            },
            {
                question: "2. С какими рабочими задачами ты готов сталкиваться на своей должности ежедневно?",
                options: [
                    { text: "Анализировать баг-репорты, вести чек-листы, работать в Jira и доказывать разработчикам, где ошибка", scores: { po: 1 } },
                    { text: "Проводить диагностику сетевого 'железа' в стойках, монтировать патч-панели и подключать абонентов", scores: { telecom: 1 } },
                    { text: "Выезжать на объекты для настройки антенно-фидерных систем и передатчиков цифрового ТВ", scores: { radio: 1 } },
                    { text: "Управлять логистической базой данных, работать со штрих-кодами, CRM-системами и координировать доставку", scores: { post: 1 } }
                ]
            },
            {
                question: "3. Каким финальным результатом своей работы на предприятии ты бы гордился больше всего?",
                options: [
                    { text: "Программа/игра вышла в релиз без единого сбоя и зависания благодаря моей проверке", scores: { po: 1 } },
                    { text: "Офисы крупного банка соединены в единую, защищенную от взлома корпоративную сеть связи", scores: { telecom: 1 } },
                    { text: "Запущена новая сотовая сеть в регионе, и тысячи людей получили доступ к мобильному 4G/5G", scores: { radio: 1 } },
                    { text: "Создана заново работающая система доставки, где ни один груз не потерялся и прибыл вовремя", scores: { post: 1 } }
                ]
            },
            {
                question: "4. Представь, что ты проходишь стажировку. Какое предприятие из партнеров БГАС ты выберешь?",
                options: [
                    { text: "Резидент Парка высоких технологий (ПВТ), занимающийся разработкой и тестированием ПО", scores: { po: 1 } },
                    { text: "РУП «Белтелеком» (настройка и администрирование сетевой инфраструктуры интернет-провайдера)", scores: { telecom: 1 } },
                    { text: "Мобильный оператор (А1, МТС или life:)) — отдел планирования и оптимизации радиосетей", scores: { radio: 1 } },
                    { text: "РУП «Белпочта» — управление транспортно-логистическими цепями и электронными сервисами", scores: { post: 1 } }
                ]
            },
            {
                question: "5. Какую техническую книгу или практический гайд ты бы открыл для самообразования в первую очередь?",
                options: [
                    { text: "«Основы QA-тестирования: как находить баги и автоматизировать тест-кейсы»", scores: { po: 2 } },
                    { text: "«Маршрутизация и коммутация в корпоративных сетях: детальное руководство Cisco»", scores: { telecom: 2 } },
                    { text: "«Принципы беспроводной связи и устройство современных антенно-фидерных систем»", scores: { radio: 2 } },
                    { text: "«Современная складская логистика: автоматизация и оптимизация товарных потоков»", scores: { post: 2 } }
                ]
            },
            {
                question: "6. Обеспечение какого процесса на государственном уровне вызывает у тебя больше всего уважения?",
                options: [
                    { text: "Защита критически важного программного обеспечения от уязвимостей и логических дефектов", scores: { po: 2 } },
                    { text: "Обеспечение бесперебойной проводной и интернет-связи для экстренных служб и ведомств", scores: { telecom: 2 } },
                    { text: "Расширение покрытия сотовой связи и трансляции национального телевидения в отдаленные районы", scores: { radio: 2 } },
                    { text: "Точная и своевременная доставка отправлений, писем, пенсий и грузов по всей территории страны", scores: { post: 2 } }
                ]
            },
            {
                question: "7. Представь, что в ИТ-компании открылся сложный проект. В какую рабочую группу ты запишешься?",
                options: [
                    { text: "Группа нагрузочного тестирования программ и поиска критических дефектов производительности", scores: { po: 2 } },
                    { text: "Группа физического развертывания мультисервисной сети связи и конфигурирования АТС", scores: { telecom: 2 } },
                    { text: "Группа планирования частотных каналов базовых станций и устранения взаимных помех", scores: { radio: 2 } },
                    { text: "Группа проектирования автоматизированного учета посылок и контроля кассовых операций", scores: { post: 2 } }
                ]
            },
            {
                question: "8. К какому типу аналитических задач у тебя лежит душа больше всего?",
                options: [
                    { text: "Анализ алгоритмов, поиск логических нестыковок в работе программ и написание скриптов", scores: { po: 2 } },
                    { text: "Проектирование схем коммутации, расчет пропускной способности физических каналов", scores: { telecom: 2 } },
                    { text: "Анализ спектра радиочастот, подбор приборов СВЧ и расчет излучения антенн", scores: { radio: 2 } },
                    { text: "Организация работы персонала, планирование графиков перевозок и ведение документации", scores: { post: 2 } }
                ]
            },
            {
                question: "9. О какой профессии ты бы рассказал будущим абитуриентам, чтобы заинтересовать их?",
                options: [
                    { text: "О QA-инженере, который предотвращает миллиардные убытки из-за мелких сбоев в программах", scores: { po: 2 } },
                    { text: "О системном администраторе, без которого не будет работать ни один банк, сайт или офис в мире", scores: { telecom: 2 } },
                    { text: "О связисте, который проводит высокоскоростной интернет и сотовую связь в труднодоступные места", scores: { radio: 2 } },
                    { text: "О логисте, благодаря которому миллионы посылок находят своих адресатов точно в срок", scores: { post: 2 } }
                ]
            }
        ],
        vo11: [
            {
                question: "1. Какая инженерно-управленческая роль в ИТ-сфере тебя привлекает на перспективу?",
                options: [
                    { text: "Fullstack Developer / Software Architect — проектировать базы данных и писать серверный код", scores: { info: 1 } },
                    { text: "Automation Engineer — программировать роботов-манипуляторов, датчики конвейера и АСУТП", scores: { auto: 1 } },
                    { text: "Telecom Network Architect — проектировать магистральные оптоволоконные трассы между городами", scores: { networks: 1 } },
                    { text: "Digital Marketer / Product Owner — настраивать таргетинг, контекстную рекламу и продвигать ИТ-продукты", scores: { market: 1 } },
                    { text: "Logistics Engineer — внедрять RFID-метки, автотрекеры и софт для управления умными складами", scores: { post_logistics: 1 } }
                ]
            },
            {
                question: "2. С какими техническими вызовами на работе тебе было бы интереснее всего разобраться?",
                options: [
                    { text: "Организовать шифрование данных и выстроить систему информационной безопасности корпорации", scores: { info: 1 } },
                    { text: "Настроить промышленный контроллер (ПЛК) так, чтобы роботы на заводе собирали детали без брака", scores: { auto: 1 } },
                    { text: "Спроектировать распределение трафика в мультисервисной сети связи, избежав перегрузок", scores: { networks: 1 } },
                    { text: "Проанализировать поведение веб-аудитории в Яндекс.Метрике и оптимизировать воронку продаж", scores: { market: 1 } },
                    { text: "Создать алгоритм, который автоматически распределяет миллионы посылок по направлениям на сортировочной ленте", scores: { post_logistics: 1 } }
                ]
            },
            {
                question: "3. Какая концепция современных технологий вызывает у тебя наибольший профессиональный интерес?",
                options: [
                    { text: "Искусственный интеллект, анализ больших данных (Big Data) и машинное обучение", scores: { info: 1 } },
                    { text: "Индустрия 4.0, интернет вещей (IoT), контроллеры Siemens/ОБЕН и системы SCADA", scores: { auto: 1 } },
                    { text: "Инфраструктура облачных провайдеров, магистральная оптика и виртуализация сетей", scores: { networks: 1 } },
                    { text: "E-mail маркетинг, SEO-оптимизация, лидогенерация и SMM-продвижение ИТ-брендов", scores: { market: 1 } },
                    { text: "Интеллектуальные транспортные системы, бесконтактная экспресс-доставка и почтоматы", scores: { post_logistics: 1 } }
                ]
            },
            {
                question: "4. Если бы ты запускал собственный бизнес, в какую сферу ты бы инвестировал свои знания?",
                options: [
                    { text: "Компания по кибербезопасности и разработке заказного ПО под ключ", scores: { info: 1 } },
                    { text: "Инжиниринговое бюро по автоматизации и модернизации конвейерных заводов", scores: { auto: 1 } },
                    { text: "Провайдер высокоскоростного беспроводного интернета и связи нового поколения", scores: { networks: 1 } },
                    { text: "Маркетинговое агентство полного цикла, специализирующееся на рекламе в ИТ-секторе", scores: { market: 1 } },
                    { text: "Инновационная курьерская служба с автоматизированной сортировкой и трекингом грузов", scores: { post_logistics: 1 } }
                ]
            },
            {
                question: "5. Какое авторитетное профессиональное сообщество в сети тебе было бы интереснее всего регулярно читать?",
                options: [
                    { text: "Блоги разработчиков ПО, обсуждающих архитектуру баз данных, паттерны и компиляторы", scores: { info: 2 } },
                    { text: "Форумы инженеров-робототехников, делящихся схемами ПЛК, датчиками движения и Arduino", scores: { auto: 2 } },
                    { text: "Сетевые сообщества, разбирающие маршрутизацию BGP, настройку оборудования Cisco и Huawei", scores: { networks: 2 } },
                    { text: "Маркетинговые порталы с кейсами о повышении конверсии, стоимости привлечения лида (CAC) и SEO", scores: { market: 2 } },
                    { text: "Информационные ресурсы об интеграции RFID-меток, IoT в логистике и систем автоматического складирования", scores: { post_logistics: 2 } }
                ]
            },
            {
                question: "6. Тема какого научного исследования или доклада на конференции привлекла бы твое внимание?",
                options: [
                    { text: "Применение нейросетей для анализа сигнатур трафика и автоматического предотвращения кибератак", scores: { info: 2 } },
                    { text: "Разработка адаптивного программного кода для синхронной работы конвейерных манипуляторов", scores: { auto: 2 } },
                    { text: "Методы спектральной оптимизации для повышения пропускной способности ВОЛС", scores: { networks: 2 } },
                    { text: "Моделирование влияния юзабилити-метрик интерфейса (UX) на конверсию продаж услуг связи", scores: { market: 2 } },
                    { text: "Использование технологии блокчейн и радиометок для отслеживания цепочки поставок ценных грузов", scores: { post_logistics: 2 } }
                ]
            },
            {
                question: "7. На каком лабораторном стенде во время учебы в академии тебе хотелось бы провести больше всего времени?",
                options: [
                    { text: "Настройка реляционных СУБД (PostgreSQL), написание API и тестирование криптозащиты", scores: { info: 2 } },
                    { text: "Программирование микроконтроллеров и визуализация процессов цеха в SCADA-системах", scores: { auto: 2 } },
                    { text: "Конфигурирование коммутаторов ядра и пограничных маршрутизаторов на реальном стенде Cisco", scores: { networks: 2 } },
                    { text: "Работа в рекламных кабинетах, настройка сквозной аналитики и проведение A/B тестов сайта", scores: { market: 2 } },
                    { text: "Интеграция датчиков спутникового слежения GPS/ГЛОНАСС с интерактивной веб-картой", scores: { post_logistics: 2 } }
                ]
            },
            {
                question: "8. В чем, по-твоему, состоит главная миссия инженера связи высшего звена в XXI веке?",
                options: [
                    { text: "Создавать надежный, безопасный софт, устойчивый к внешним воздействиям и взломам", scores: { info: 2 } },
                    { text: "Полностью освободить человека от рутины и опасной работы на производстве за счет автоматики", scores: { auto: 2 } },
                    { text: "Строить скоростные магистрали обмена информацией, физически связывающие континенты", scores: { networks: 2 } },
                    { text: "Находить новые бизнес-модели, развивать цифровые рынки и продвигать новые бренды", scores: { market: 2 } },
                    { text: "Оптимизировать глобальную логистику ресурсов для максимального ускорения мировых поставок", scores: { post_logistics: 2 } }
                ]
            },
            {
                question: "9. Выберите тип дипломной практической разработки, который принесет тебе наибольший драйв:",
                options: [
                    { text: "Собственный веб-сервис с развернутой базой данных и сквозной системой авторизации пользователей", scores: { info: 2 } },
                    { text: "Программный модуль управления автономным роботом-сортировщиком на базе контроллера", scores: { auto: 2 } },
                    { text: "Развертывание отказоустойчивой корпоративной ИС связи на базе оборудования Huawei/Cisco", scores: { networks: 2 } },
                    { text: "Запуск полноценной рекламной кампании в соцсетях со сквозным анализом конверсии", scores: { market: 2 } },
                    { text: "Разработка мобильного трекера посылки с датчиком открытия контейнера и отправкой алертов", scores: { post_logistics: 2 } }
                ]
            }
        ]
    };

    const startSelectedTest = (testKey) => {
        setCurrentTestKey(testKey);
        setCurrentQuestionIndex(0);
        setQuizScores({});
        setAnswersHistory([]);
        setQuizStep(4);
    };

    const handleAnswerSelect = (scores) => {
        setQuizScores(prev => {
            const newScores = { ...prev };
            Object.keys(scores).forEach(key => {
                newScores[key] = (newScores[key] || 0) + scores[key];
            });
            return newScores;
        });
        setAnswersHistory(prev => [...prev, scores]);

        const activeTest = quizDatabases[currentTestKey];
        if (currentQuestionIndex < activeTest.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            if (currentTestKey === 'sso11') {
                setQuizStep(5);
            } else {
                setQuizStep(6);
            }
        }
    };

    const handleQuizBack = () => {
        if (quizStep === 2) {
            setQuizStep(1);
            setTargetLevel('');
        } else if (quizStep === 4) {
            if (currentQuestionIndex > 0) {
                const lastAddedScores = answersHistory[answersHistory.length - 1];
                if (lastAddedScores) {
                    setQuizScores(prev => {
                        const newScores = { ...prev };
                        Object.keys(lastAddedScores).forEach(key => {
                            newScores[key] = Math.max(0, (newScores[key] || 0) - lastAddedScores[key]);
                        });
                        return newScores;
                    });
                    setAnswersHistory(prev => prev.slice(0, -1));
                }
                setCurrentQuestionIndex(prev => prev - 1);
            } else {
                if (currentTestKey === 'vo11') {
                    setQuizStep(1);
                    setCurrentTestKey(null);
                } else {
                    setQuizStep(2);
                    setCurrentTestKey(null);
                }
                setQuizScores({});
                setAnswersHistory([]);
            }
        } else if (quizStep === 5) {
            const activeTest = quizDatabases[currentTestKey];
            const lastIndex = activeTest.length - 1;
            const lastAddedScores = answersHistory[answersHistory.length - 1];
            if (lastAddedScores) {
                setQuizScores(prev => {
                    const newScores = { ...prev };
                    Object.keys(lastAddedScores).forEach(key => {
                        newScores[key] = Math.max(0, (newScores[key] || 0) - lastAddedScores[key]);
                    });
                    return newScores;
                });
                setAnswersHistory(prev => prev.slice(0, -1));
            }
            setCurrentQuestionIndex(lastIndex);
            setQuizStep(4);
        } else if (quizStep === 6) {
            if (currentTestKey === 'sso11') {
                setQuizStep(5);
            } else {
                const activeTest = quizDatabases[currentTestKey];
                const lastIndex = activeTest.length - 1;
                const lastAddedScores = answersHistory[answersHistory.length - 1];
                if (lastAddedScores) {
                    setQuizScores(prev => {
                        const newScores = { ...prev };
                        Object.keys(lastAddedScores).forEach(key => {
                            newScores[key] = Math.max(0, (newScores[key] || 0) - lastAddedScores[key]);
                        });
                        return newScores;
                    });
                    setAnswersHistory(prev => prev.slice(0, -1));
                }
                setCurrentQuestionIndex(lastIndex);
                setQuizStep(4);
            }
        }
    };

    const getWinnerKey = () => {
        let winner = null;
        let maxVal = -1;
        Object.keys(quizScores).forEach(key => {
            if (quizScores[key] > maxVal) {
                maxVal = quizScores[key];
                winner = key;
            }
        });
        return winner;
    };

    const calculateRecommendation = () => {
        const winner = getWinnerKey();

        if (currentTestKey === 'sso9') {
            if (winner === 'web') return {
                name: "Разработка и сопровождение веб-ресурсов",
                desc: "Проектирование веб-интерфейсов, верстка шаблонов сайтов и написание клиентского кода на JavaScript.",
                url: "pages/monitoring/specialty.html?level=sso9&form=dnev&name=Разработка и сопровождение веб-ресурсов"
            };
            if (winner === 'po') return {
                name: "Тестирование программного обеспечения",
                desc: "Контроль качества программных продуктов, автоматизация тестов, составление баг-репортов и аудит QA.",
                url: "pages/monitoring/specialty.html?level=sso9&form=dnev&name=Тестирование программного обеспечения"
            };
            if (winner === 'cable') return {
                name: "Информационные кабельные сети",
                desc: "Монтаж и обслуживание волоконно-оптических (ВОЛС) и локальных проводных инфокоммуникационных линий связи.",
                url: "pages/monitoring/specialty.html?level=sso9&form=dnev&name=Информационные кабельные сети"
            };
            if (winner === 'radio') return {
                name: "Техническая эксплуатация систем радиосвязи, вещания и телевидения",
                desc: "Обеспечение стабильной работы радиовещательных станций, спутниковых систем и цифрового ТВ.",
                url: "pages/monitoring/specialty.html?level=sso9&form=dnev&name=Техническая эксплуатация систем радиосвязи, вещания и телевидения"
            };
            if (winner === 'multi') return {
                name: "Техническая эксплуатация мультимедийных систем",
                desc: "Профессиональная настройка студийного, концертного звука, акустических платформ и мультимедиа-экранов.",
                url: "pages/monitoring/specialty.html?level=sso9&form=dnev&name=Техническая эксплуатация мультимедийных систем"
            };
            if (winner === 'post') return {
                name: "Почтовая деятельность (9 кл.)",
                desc: "Логистическое управление распределением отправлений, координация доставок и автоматизированный клиентский сервис.",
                url: "pages/monitoring/specialty.html?level=sso9&form=dnev&name=Почтовая деятельность"
            };
            return {
                name: "Техническая эксплуатация систем и сетей телекоммуникаций",
                desc: "Администрирование серверов связи, маршрутизация потоков данных и конфигурирование АТС.",
                url: "pages/monitoring/specialty.html?level=sso9&form=dnev&name=Техническая эксплуатация систем и сетей телекоммуникаций"
            };
        }

        if (currentTestKey === 'sso11') {
            if (winner === 'po') return {
                name: "Тестирование программного обеспечения (11 кл., Дневное)",
                desc: "Быстрый вход в ИТ-индустрию через практическое освоение ручного и автоматического тестирования ПО за 2 года.",
                url: "pages/monitoring/specialty.html?level=sso11&form=dnev&name=Тестирование программного обеспечения"
            };
            if (winner === 'radio') {
                return targetForm === 'zaoch' ? {
                    name: "Техническая эксплуатация систем радиосвязи, вещания и телевидения (Заочное)",
                    desc: "Заочное обучение эксплуатации радиоэлектронного оборудования связи и систем вещания.",
                    url: "pages/monitoring/specialty.html?level=sso11&form=zaoch&name=Техническая эксплуатация систем радиосвязи, вещания и телевидения"
                } : {
                    name: "Техническая эксплуатация систем радиосвязи, вещания и телевидения (Дневное)",
                    desc: "Очное обучение построению радиолиний, спутниковых сетей вещания и мобильной телефонии.",
                    url: "pages/monitoring/specialty.html?level=sso11&form=dnev&name=Техническая эксплуатация систем радиосвязи, вещания и телевидения"
                };
            }
            if (winner === 'post') {
                return targetForm === 'zaoch' ? {
                    name: "Почтовая деятельность (Заочное)",
                    desc: "Заочный курс менеджмента почтово-транспортных сетей и систем складского распределения.",
                    url: "pages/monitoring/specialty.html?level=sso11&form=zaoch&name=Почтовая деятельность"
                } : {
                    name: "Почтовая деятельность (Дневное)",
                    desc: "Очное обучение цифровой транспортной логистике, управлению потоками отправлений и сервисам обслуживания.",
                    url: "pages/monitoring/specialty.html?level=sso11&form=dnev&name=Почтовая деятельность"
                };
            }
            return targetForm === 'zaoch' ? {
                name: "Техническая эксплуатация систем и сетей телекоммуникаций (Заочное)",
                desc: "Заочное освоение сетевого администрирования и эксплуатации современных систем связи.",
                url: "pages/monitoring/specialty.html?level=sso11&form=zaoch&name=Техническая эксплуатация систем и сетей телекоммуникаций"
            } : {
                name: "Техническая эксплуатация систем и сетей телекоммуникаций (Дневное)",
                desc: "Очное освоение монтажа оптических трасс, настройки маршрутизаторов и серверов связи.",
                url: "pages/monitoring/specialty.html?level=sso11&form=dnev&name=Техническая эксплуатация систем и сетей телекоммуникаций"
            };
        }

        if (currentTestKey === 'vo11') {
            if (winner === 'info') return {
                name: "Прикладная информатика (ВО)",
                desc: "Комплексная инженерно-математическая подготовка full-stack разработчиков и архитекторов ИС.",
                url: "pages/monitoring/specialty.html?level=vo11&form=dnev&name=Прикладная информатика"
            };
            if (winner === 'auto') return {
                name: "Автоматизация технологических процессов и производств",
                desc: "Программирование микроконтроллеров и промышленных ПЛК, робототехнические комплексы и индустрия 4.0.",
                url: "pages/monitoring/specialty.html?level=vo11&form=dnev&name=Автоматизация технологических процессов и производств"
            };
            if (winner === 'market') return {
                name: "Маркетинг (ВО)",
                desc: "Анализ отраслевых рынков услуг связи, разработка веб-рекламы, продуктовый менеджмент и PR.",
                url: "pages/monitoring/specialty.html?level=vo11&form=dnev&name=Маркетинг"
            };
            if (winner === 'post_logistics') return {
                name: "Цифровые клиентские сервисы и почтово-логистические системы",
                desc: "Почтово-логистические хабы, программирование логистических цепочек и интеграция баз данных доставок.",
                url: "pages/monitoring/specialty.html?level=vo11&form=dnev&name=Цифровые клиентские сервисы и почтово-логистические системы"
            };
            return {
                name: "Системы и сети инфокоммуникаций (11 кл.)",
                desc: "Магистральное проектирование оптоволоконных, космических и сотовых инфраструктур передачи информации.",
                url: "pages/monitoring/specialty.html?level=vo11&form=dnev&name=Системы и сети инфокоммуникаций"
            };
        }
    };

    const resetQuiz = () => {
        setQuizStep(1);
        setTargetLevel('');
        setTargetForm('dnev');
        setCurrentTestKey(null);
        setCurrentQuestionIndex(0);
        setQuizScores({});
        setAnswersHistory([]);
    };

    // Проверка расширенного режима для сравнения на ноутбуках/десктопах
    const isExpandedCompare = isCompareWindowOpen && !compareLoading && comparisonData.length > 0;

    // Динамические стили вынесены в переменную для предотвращения ошибок синтаксического анализа Babel
    const cabinetStyle = {};
    if (isExpandedCompare) {
        cabinetStyle.width = 'min(780px, 95vw)';
        cabinetStyle.height = 'auto'; // Высота динамически подстраивается под высоту таблицы
        cabinetStyle.maxHeight = '92vh'; // Предотвращает упирание в низ экрана ноутбука
    }
    cabinetStyle.transition = 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1), height 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    return (
        <div className="cabinet-window" style={cabinetStyle}>
            {isCompareWindowOpen ? (
                // ==========================================================================
                // СРАВНЕНИЕ СПЕЦИАЛЬНОСТЕЙ (ТЕПЕРЬ В ЕСТЕСТВЕННОМ ПОТОКЕ - БЕЗ СРЕЗОВ ТАБЛИЦЫ!)
                // ==========================================================================
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'inherit', padding: '15px 15px 20px 15px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(113, 128, 150, 0.15)', paddingBottom: '10px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Сравнение специальностей</h2>
                        <button className="ai-close-btn" style={{ color: 'inherit' }} onClick={() => { setIsCompareWindowOpen(false); setComparisonData([]); }}>{"×"}</button>
                    </div>

                    {compareLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                            <div className="loader-text" style={{ fontStyle: 'normal' }}>Считывание live-данных из базы...</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Таблица с горизонтальной прокруткой и заблокированной вертикальной */}
                            <div style={{ overflowX: 'auto', overflowY: 'hidden', marginBottom: '15px', width: '100%' }}>
                                <table className="bar-table" style={{ fontSize: '13.5px', borderCollapse: 'collapse', width: '100%', textAlign: 'left', minWidth: '450px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'rgba(113, 128, 150, 0.1)' }}>
                                            <th style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.2)', fontSize: '14px' }}>Параметр</th>
                                            {comparisonData.map((spec, idx) => (
                                                <th key={idx} style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.2)', color: '#007bff', fontSize: '14px' }}>
                                                    {spec.name.replace(/\(.*?\)/g, "").trim()}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>База / Уровень</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)' }}>
                                                    {spec.levelLabel} ({spec.baseLabel})
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>Форма / Оплата</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)' }}>
                                                    {spec.formLabel} ({spec.categoryLabel.toLowerCase()})
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>Срок обучения</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)' }}>
                                                    {spec.duration}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>План приема</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)', fontWeight: 'bold' }}>
                                                    {spec.plan}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>Подано заявлений</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)' }}>
                                                    {spec.totalApps}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>Конкурс (чел./место)</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)', fontWeight: 'bold', color: 'inherit' }}>
                                                    {spec.competitionRatio}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ backgroundColor: 'rgba(46, 125, 50, 0.05)', transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>Проходной 2025</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)', fontWeight: 'bold', color: 'inherit' }}>
                                                    {spec.archScore}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr style={{ backgroundColor: 'rgba(0, 123, 255, 0.05)', transition: 'background-color 0.2s' }}>
                                            <td style={{ padding: '10px 12px', fontWeight: 'bold', border: '1px solid rgba(113,128,150,0.15)' }}>Текущий балл 2026</td>
                                            {comparisonData.map((spec, idx) => (
                                                <td key={idx} style={{ padding: '10px 12px', border: '1px solid rgba(113,128,150,0.15)', fontWeight: 'bold', color: '#007bff' }}>
                                                    {spec.livePassingScore}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ fontSize: '11.5px', opacity: 0.7, textAlign: 'left', lineHeight: '1.5', marginBottom: '12px' }}>
                                * Примечание: Teкущий балл 2026 года формируется динамически на основе поданных в данный момент документов и изменится по ходу приемной кампании. Свободные места означают, что конкурс еще не полностью заполнен.
                            </div>

                            <button
                                onClick={() => { setIsCompareWindowOpen(false); setComparisonData([]); }}
                                className="btn-arrow"
                                style={{ width: '100%', height: '42px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                Вернуться к списку
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // ==========================================================================
                // СТАНДАРТНЫЙ РЕЖИМ РАБОТЫ КАБИНЕТА (Остальные вкладки)
                // ==========================================================================
                <React.Fragment>
                    {/* Верхний информационный блок профиля / регистрации */}
                    <div className="cab-profile-panel" style={{ padding: '12px 15px', backgroundColor: 'rgba(113, 128, 150, 0.08)', borderBottom: '1px solid rgba(113, 128, 150, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {user ? (
                            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#2e7d32' }}>✓ Авторизован: {user.email}</span>
                                <span style={{ fontSize: '11px', opacity: 0.85, color: 'inherit' }}>Спец.: {user.submitted_specialty} | Балл: {user.score}</span>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'left' }}>
                                <span style={{ fontSize: '11.5px', opacity: 0.8, fontWeight: '600' }}>Хотите получать сообщения?</span>
                            </div>
                        )}

                        {user ? (
                            <button onClick={handleLogout} className="btn-arrow btn-gray" style={{ fontSize: '10px', padding: '5px 10px', height: 'auto', border: 'none', cursor: 'pointer' }}>
                                Выйти
                            </button>
                        ) : (
                            <button
                                onClick={() => { setIsRegWindowOpen(true); setRegStep(1); }}
                                className="btn-arrow"
                                style={{ fontSize: '11px', padding: '5px 12px', height: 'auto', border: 'none', cursor: 'pointer' }}
                            >
                                Регистрация
                            </button>
                        )}
                    </div>

                    {/* Вкладки навигации по Кабинету */}
                    <div className="cabinet-tabs">
                        <button
                            className={`cabinet-tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
                            onClick={() => setActiveTab('checklist')}
                        >
                            Чек-лист
                        </button>
                        <button
                            className={`cabinet-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                            onClick={() => setActiveTab('favorites')}
                        >
                            Избранное
                        </button>
                        <button
                            className={`cabinet-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                            onClick={() => setActiveTab('quiz')}
                        >
                            Выбор специальности
                        </button>
                    </div>

                    <div className="cabinet-body">
                        {showRecBanner && recommendations.length > 0 && (
                            <div style={{
                                backgroundColor: 'rgba(239, 83, 80, 0.08)',
                                borderLeft: '4px solid #ef5350',
                                borderRadius: '12px',
                                padding: '12px 15px',
                                marginBottom: '15px',
                                textAlign: 'left'
                            }}>
                                <strong style={{ color: '#ef5350', fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                                    ⚠️ Высокий риск непроизводства на бюджет!
                                </strong>
                                <span style={{ fontSize: '12px', lineHeight: '1.4', display: 'block', marginBottom: '8px', opacity: 0.9 }}>
                                    Текущие баллы по специальности <strong style={{ color: 'inherit' }}>{user.submitted_specialty}</strong> выросли. Посмотрите подходящие по баллу альтернативы со свободными местами:
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {recommendations.map((rec, idx) => (
                                        <div key={idx} style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '11.5px'
                                        }}>
                                            <span style={{ fontWeight: 'bold', flex: 1, paddingRight: '10px' }}>
                                                {rec.name}
                                            </span>
                                            <a href={rec.url} className="btn-arrow" style={{
                                                padding: '3px 8px',
                                                fontSize: '10px',
                                                height: 'auto',
                                                textDecoration: 'none',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {rec.hasFreeSeats ? 'Есть места' : 'Проходите'} →
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'checklist' && (
                            <div>
                                <div className="cab-checklist-filters">
                                    <div className="cab-filter-row">
                                        <label>Куда поступаю:</label>
                                        <select className="cab-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                                            <option value="sso">В колледж (ССО)</option>
                                            <option value="vo_full">В университет (ВО, полный срок)</option>
                                            <option value="vo_short">В университет (ВО, сокращенный срок)</option>
                                        </select>
                                    </div>
                                    <div className="cab-filter-row">
                                        <label>Форма обучения:</label>
                                        {level === 'vo_full' ? (
                                            <select className="cab-select" value="dnev" disabled>
                                                <option value="dnev">Дневная</option>
                                            </select>
                                        ) : (
                                            <select className="cab-select" value={form} onChange={(e) => setForm(e.target.value)}>
                                                <option value="dnev">Дневная</option>
                                                <option value="zaoch">Заочная</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="cab-filter-row">
                                        <label>Мне меньше 18 лет:</label>
                                        <select className="cab-select" value={isMinor} onChange={(e) => setIsMinor(e.target.value)}>
                                            <option value="no">Нет</option>
                                            <option value="yes">Да</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="cab-checklist-list">
                                    {getRequiredDocuments().map((doc) => {
                                        const isChecked = !!checkedItems[doc.id];
                                        return (
                                            <label key={doc.id} className={`cab-checklist-item ${isChecked ? 'completed' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleCheckboxChange(doc.id)}
                                                />
                                                <span>{doc.text}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ВКЛАДКА: ИЗБРАННОЕ И СРАВНЕНИЕ СПЕЦИАЛЬНОСТЕЙ */}
                        {activeTab === 'favorites' && (
                            <div style={{ textAlign: 'left' }}>
                                {favorites.length === 0 ? (
                                    <div style={{ padding: '20px 10px', textAlign: 'center', opacity: 0.6 }}>
                                        <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>🤍</span>
                                        Ваш список избранных специальностей пуст.<br />
                                        Ставьте ❤️ на страницах специальностей, чтобы добавить их сюда для мониторинга и сравнения.
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold', opacity: 0.8 }}>Выбрано: {favorites.length}</span>

                                            {/* Две раздельные кнопки в режиме сравнения: Отмена и Сравнить */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {isCompareMode ? (
                                                    <React.Fragment>
                                                        <button
                                                            onClick={() => {
                                                                setIsCompareMode(false);
                                                                setCheckedCompare([]);
                                                            }}
                                                            className="btn-arrow btn-gray"
                                                            style={{ fontSize: '11px', padding: '6px 12px', border: 'none', cursor: 'pointer' }}
                                                        >
                                                            Отмена
                                                        </button>
                                                        <button
                                                            onClick={startComparison}
                                                            className={`btn-arrow ${checkedCompare.length >= 2 ? 'active-compare-glow' : 'btn-gray'}`}
                                                            style={{
                                                                fontSize: '11px',
                                                                padding: '6px 14px',
                                                                border: 'none',
                                                                cursor: checkedCompare.length >= 2 ? 'pointer' : 'not-allowed',
                                                                boxShadow: checkedCompare.length >= 2 ? '0 0 10px rgba(0, 123, 255, 0.4)' : 'none',
                                                                opacity: checkedCompare.length >= 2 ? 1 : 0.6,
                                                                transition: 'all 0.3s ease'
                                                            }}
                                                            disabled={checkedCompare.length < 2}
                                                        >
                                                            Открыть сравнение
                                                        </button>
                                                    </React.Fragment>
                                                ) : (
                                                    <button
                                                        onClick={() => setIsCompareMode(true)}
                                                        className="btn-arrow btn-gray"
                                                        style={{ fontSize: '11px', padding: '6px 14px', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        Сравнить
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {favorites.map((item, idx) => {
                                                const isChecked = checkedCompare.some(f => f.name === item.name && f.level === item.level && f.form === item.form && f.category === item.category);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="route-card"
                                                        style={{
                                                            padding: '12px 14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            margin: 0,
                                                            borderLeft: '4px solid #007bff'
                                                        }}
                                                    >
                                                        {isCompareMode && (
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleCompareCheckboxChange(item)}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                                                            />
                                                        )}

                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <a
                                                                href={getSanitizedUrl(item)}
                                                                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                                            >
                                                                <strong style={{ fontSize: '13.5px', color: '#007bff', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                                    {item.name}
                                                                </strong>
                                                                <span style={{ fontSize: '11px', opacity: 0.75, display: 'block', marginTop: '3px' }}>
                                                                    Уровень: {item.level.startsWith('vo') ? 'ВО' : 'ССО'} | {item.form === 'zaoch' ? 'Заочное' : 'Дневное'} | {item.category === 'budget' ? 'Бюджет' : 'Платно'}
                                                                </span>
                                                            </a>
                                                        </div>

                                                        {!isCompareMode && (
                                                            <button
                                                                onClick={() => removeFavoriteItem(item)}
                                                                style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', opacity: 0.6, padding: '0 5px' }}
                                                                title="Удалить из избранного"
                                                            >
                                                                {"×"}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'quiz' && (
                            <div>
                                {quizStep > 1 && (
                                    <button className="cab-quiz-back-btn" onClick={handleQuizBack}>
                                        ← Назад
                                    </button>
                                )}

                                {quizStep === 1 && (
                                    <div>
                                        <p className="cab-quiz-question">Какой уровень образования тебя интересует?</p>
                                        <div className="cab-quiz-options">
                                            <button className="cab-quiz-btn" onClick={() => { setTargetLevel('sso'); setQuizStep(2); }}>Поступление в Колледж (ССО)</button>
                                            <button className="cab-quiz-btn" onClick={() => { setTargetLevel('vo'); startSelectedTest('vo11'); }}>Поступление в Академию (ВО, 11 кл.)</button>
                                        </div>
                                    </div>
                                )}

                                {quizStep === 2 && (
                                    <div>
                                        <p className="cab-quiz-question">Какая база образования у тебя на момент поступления?</p>
                                        <div className="cab-quiz-options">
                                            <button className="cab-quiz-btn" onClick={() => startSelectedTest('sso9')}>На базе 9 классов (ССО)</button>
                                            <button className="cab-quiz-btn" onClick={() => startSelectedTest('sso11')}>На базе 11 классов (ССО)</button>
                                        </div>
                                    </div>
                                )}

                                {quizStep === 4 && currentTestKey && (
                                    <div>
                                        <p className="cab-quiz-progress">
                                            Вопрос {currentQuestionIndex + 1} из {quizDatabases[currentTestKey].length}
                                        </p>
                                        <p className="cab-quiz-question">
                                            {quizDatabases[currentTestKey][currentQuestionIndex].question}
                                        </p>
                                        <div className="cab-quiz-options">
                                            {quizDatabases[currentTestKey][currentQuestionIndex].options.map((opt, idx) => (
                                                <button key={idx} className="cab-quiz-btn" onClick={() => handleAnswerSelect(opt.scores)}>
                                                    {opt.text}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {quizStep === 5 && (
                                    <div>
                                        <p className="cab-quiz-question">Какой формат обучения тебе предпочтительнее?</p>
                                        <div className="cab-quiz-options">
                                            <button className="cab-quiz-btn" onClick={() => { setTargetForm('dnev'); setQuizStep(6); }}>Дневная форма получения образования</button>
                                            <button className="cab-quiz-btn" onClick={() => { setTargetForm('zaoch'); setQuizStep(6); }}>Заочная форма получения образования</button>
                                        </div>
                                    </div>
                                )}

                                {quizStep === 6 && (
                                    <div className="quiz-result-box">
                                        <p className="cab-quiz-result-title">Результат тестирования:</p>
                                        <div className="cab-quiz-result-card">
                                            <strong className="cab-quiz-result-name">{calculateRecommendation().name}</strong>
                                            <span className="cab-quiz-result-desc">{calculateRecommendation().desc}</span>
                                        </div>
                                        <div className="cab-quiz-actions">
                                            <a href={calculateRecommendation().url} className="btn-arrow">Смотреть конкурс</a>
                                            <button className="btn-arrow btn-gray" onClick={resetQuiz}>Пройти заново</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ВСПЛЫВАЮЩЕЕ ОКНО РЕГИСТРАЦИИ (РЕНДЕРИТСЯ КАК ДОЧЕРНИЙ ЭЛЕМЕНТ В ЕСТЕСТВЕННОМ ПОТОКЕ) */}
                    {isRegWindowOpen && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', margin: 0, zIndex: 100060, display: 'flex', flexDirection: 'column', backgroundColor: 'inherit', borderRadius: 'inherit' }}>

                            <div className="cabinet-header">
                                <div className="cabinet-header-title">
                                    Регистрация абитуриента
                                </div>
                                <button className="ai-close-btn" onClick={() => setIsRegWindowOpen(false)}>{"×"}</button>
                            </div>

                            <div className="cabinet-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'inherit' }}>
                                {regStep === 1 ? (
                                    <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '11px', textAlign: 'left', flex: 1 }}>

                                        {/* Дисклеймер условий регистрации */}
                                        <div style={{ backgroundColor: 'rgba(113, 128, 150, 0.08)', borderLeft: '3px solid #007bff', padding: '9px 12px', borderRadius: '8px', fontSize: '11.5px', lineHeight: '1.4', color: 'inherit' }}>
                                            <strong>Важно!</strong> Регистрация необходима исключительно для получения официальных сообщений и уведомлений от академии. Пожалуйста, регистрируйтесь <strong>только после фактической подачи документов</strong> в приемную комиссию БГАС.
                                        </div>

                                        {/* Поле: Email */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Ваш адрес электронной почты (Email):</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="example@mail.ru"
                                                className="score-search-input"
                                                style={{ fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', height: '38px', backgroundColor: 'transparent', color: 'inherit' }}
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                            />
                                        </div>

                                        {/* Поле-Слайдер: Уровень образования */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Уровень образования:</label>
                                            <div style={{ display: 'flex', backgroundColor: 'rgba(113, 128, 150, 0.08)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setRegLevel('sso')}
                                                    style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: regLevel === 'sso' ? '#007bff' : 'transparent', color: regLevel === 'sso' ? '#ffffff' : '#718096', transition: 'all 0.2s' }}
                                                >
                                                    Колледж (ССО)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRegLevel('vo')}
                                                    style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: regLevel === 'vo' ? '#007bff' : 'transparent', color: regLevel === 'vo' ? '#ffffff' : '#718096', transition: 'all 0.2s' }}
                                                >
                                                    Академия (ВО)
                                                </button>
                                            </div>
                                        </div>

                                        {/* Поле-Слайдер: База образования */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>База образования:</label>
                                            <div style={{ display: 'flex', backgroundColor: 'rgba(113, 128, 150, 0.08)', padding: '4px', borderRadius: '10px', gap: '4px', flexWrap: 'wrap' }}>
                                                {regLevel === 'sso' ? (
                                                    <React.Fragment>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRegBase('9cl')}
                                                            style={{ flex: 1, minWidth: '70px', padding: '6px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: regBase === '9cl' ? '#007bff' : 'transparent', color: regBase === '9cl' ? '#ffffff' : '#718096', transition: 'all 0.2s' }}
                                                        >
                                                            9 кл.
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRegBase('11cl')}
                                                            style={{ flex: 1, minWidth: '70px', padding: '6px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: regBase === '11cl' ? '#007bff' : 'transparent', color: regBase === '11cl' ? '#ffffff' : '#718096', transition: 'all 0.2s' }}
                                                        >
                                                            11 кл.
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRegBase('pto')}
                                                            style={{ flex: 1, minWidth: '70px', padding: '6px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: regBase === 'pto' ? '#007bff' : 'transparent', color: regBase === 'pto' ? '#ffffff' : '#718096', transition: 'all 0.2s' }}
                                                        >
                                                            ПТО
                                                        </button>
                                                    </React.Fragment>
                                                ) : (
                                                    <React.Fragment>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRegBase('11cl')}
                                                            style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: regBase === '11cl' ? '#007bff' : 'transparent', color: regBase === '11cl' ? '#ffffff' : '#718096', transition: 'all 0.2s' }}
                                                        >
                                                            11 кл. (Полный)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRegBase('sso_short')}
                                                            style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: regBase === 'sso_short' ? '#007bff' : 'transparent', color: regBase === 'sso_short' ? '#ffffff' : '#718096', transition: 'all 0.2s' }}
                                                        >
                                                            ССО (Сокращ.)
                                                        </button>
                                                    </React.Fragment>
                                                )}
                                            </div>
                                        </div>

                                        {/* Поле: Средний балл */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>
                                                {regLevel === 'sso' ? 'Ваш средний балл (1.0 - 10.0):' : (regBase === 'sso_short' ? 'Суммарный балл (0 - 300):' : 'Суммарный балл (0 - 400):')}
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder={regLevel === 'sso' ? "8.5" : (regBase === 'sso_short' ? "210" : "285")}
                                                className="score-search-input"
                                                style={{ fontSize: '13px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', height: '38px', backgroundColor: 'transparent', color: 'inherit' }}
                                                value={regScore}
                                                onChange={handleScoreChange}
                                            />
                                        </div>

                                        {/* Поле: Выбор специальности */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#718096' }}>Специальность, на которую поданы документы:</label>
                                            <select
                                                className="cab-select"
                                                style={{ width: '100%', height: '38px', fontSize: '13px', borderRadius: '8px', padding: '8px 10px' }}
                                                value={regSpecialty}
                                                onChange={(e) => setRegSpecialty(e.target.value)}
                                            >
                                                {(specialtiesDatabase[regLevel]?.[regBase] || []).map((spec, index) => (
                                                    <option key={index} value={spec}>{spec}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Кнопка отправки формы */}
                                        <button
                                            type="submit"
                                            className="btn-arrow"
                                            style={{ width: '100%', height: '42px', marginTop: 'auto', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            disabled={regLoading}
                                        >
                                            {regLoading ? 'Отправка...' : 'Зарегистрироваться'}
                                        </button>
                                    </form>
                                ) : (
                                    // Ввод 4-значного кода подтверждения
                                    <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center', paddingTop: '20px', flex: 1, backgroundColor: 'inherit' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', color: '#007bff', marginBottom: '10px' }}>Подтверждение регистрации</h3>
                                            <p style={{ fontSize: '13px', opacity: 0.85, lineHeight: '1.5' }}>
                                                Мы отправили письмо с временным кодом на почту <strong style={{ color: '#007bff' }}>{regEmail}</strong>.<br />
                                                Пожалуйста, проверьте папку «Входящие» и введите код.
                                            </p>
                                        </div>

                                        {/* Сбалансированный и центрированный блок ввода кода */}
                                        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                                            <input
                                                type="text"
                                                required
                                                maxLength="4"
                                                placeholder="0000"
                                                className="score-search-input"
                                                style={{
                                                    fontSize: '28px',
                                                    letterSpacing: '12px',
                                                    paddingLeft: '12px',
                                                    textAlign: 'center',
                                                    width: '180px',
                                                    height: '52px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #007bff',
                                                    outline: 'none',
                                                    backgroundColor: 'transparent',
                                                    color: 'inherit'
                                                }}
                                                value={regOtp}
                                                onChange={(e) => setRegOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                            />
                                        </div>

                                        {/* Блок динамического таймера повторной отправки */}
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                            {resendTimer > 0 ? (
                                                <span>Повторный запрос кода доступен через <strong style={{ color: '#007bff' }}>{resendTimer} сек.</strong></span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResendCode}
                                                    style={{ background: 'none', border: 'none', color: '#007bff', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontSize: '12.5px', fontFamily: 'inherit' }}
                                                    disabled={regLoading}
                                                >
                                                    Запросить код повторно
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                                            <button
                                                type="submit"
                                                className="btn-arrow"
                                                style={{ width: '100%', height: '42px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                disabled={regLoading}
                                            >
                                                {regLoading ? 'Секунду...' : 'Подтвердить код'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRegStep(1)}
                                                className="btn-arrow btn-gray"
                                                style={{ width: '100%', height: '42px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                disabled={regLoading}
                                            >
                                                Вернуться к заполнению анкеты
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </React.Fragment>
            )}
        </div>
    );
}

// Экспортируем компонент в глобальную область видимости
window.PersonalCabinet = PersonalCabinet;