import React from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, getDocs, onSnapshot, query, where, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Shield, Users, FileText, PlusCircle, Edit, Trash2, LogOut, Calendar, MapPin, ClipboardList, CheckSquare, XSquare, BarChart2, AlertTriangle, Download, History, UserPlus, Bell, ChevronDown, ChevronUp } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
// Para publicar na Vercel, você DEVE configurar esta variável de ambiente.
// Nome da variável: REACT_APP_FIREBASE_CONFIG
// Valor: O objeto de configuração do Firebase, colado como uma string.
// Se a variável não for encontrada, o app usará um objeto vazio, causando um erro controlado.
const firebaseConfig = process.env.REACT_APP_FIREBASE_CONFIG
    ? JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG)
    : {};

const appId = 'egide-pcc-app'; // O App ID pode ser fixo para o projeto

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DADOS E ASSETS ---
const PCCE_LOGO_URL = 'https://www.policiacivil.ce.gov.br/wp-content/uploads/sites/26/2019/11/NOVO-brasa%CC%83o-PC-Ceara%CC%81-600x600.jpeg';

const DEPARTMENTS = {
    "DPC": ["1º DP", "2º DP", "3º DP", "4º DP", "5º DP", "6º DP", "7º DP", "8º DP", "9º DP", "10º DP", "11º DP", "12º DP", "13º DP", "14º DP", "15º DP", "16º DP", "17º DP", "18º DP", "19º DP", "20º DP", "21º DP", "22º DP", "23º DP", "24º DP", "25º DP"],
    "DPM": ["1ª DP de Maracanaú", "2ª DP de Maracanaú", "1ª DP de Caucaia", "2ª DP de Caucaia", "3ª DP de Maracanaú", "4ª DP de Maracanaú", "3ª DP de Caucaia", "4ª DP de Caucaia", "1ª DP de Pacatuba", "5ª DP de Maracanaú", "6ª DP de Maracanaú", "5ª DP de Caucaia", "DP de Aquiraz", "DP de Cascavel", "DP de Chorozinho", "DP de Eusébio", "DP de Guaiúba", "DP de Horizonte", "DP de Itaitinga", "DP de Maranguape", "DP de Pacajus", "2ª DP de Pacatuba", "DP de Pindoretama", "DP de São Gonçalo do Amarante", "DP de Paracuru", "DP de Paraipaba", "DP de Trairí", "DP de São Luís do Curu"],
    "DPE": ["DAER", "DECAP", "DECON", "DPMA", "DEPROTUR", "DRCC", "DADT"],
    "DHPP": ["1ª DHPP", "2ª DHPP", "3ª DHPP", "4ª DHPP", "5ª DHPP", "6ª DHPP", "7ª DHPP", "8ª DHPP", "9ª DHPP", "10ª DHPP", "11ª DHPP", "12ª DHPP"],
    "DPGV": ["1ª DDM de Fortaleza", "2ª DDM de Fortaleza", "DCA", "DECECA", "DDM de Maracanaú", "DDM de Pacatuba", "DPIPD", "DECRIN"],
    "DRA": ["DECOR", "DCLD", "DECOT"],
    "DRCO": ["DRACO", "DENARC", "DESARME"],
    "DEPATRI": ["DAS", "DRF", "DRFV", "DDF"],
    "CORE": ["CORE"], "DTO": ["DTO"], "CODIP": ["CODIP"], "COTIC": ["COTIC"], "COGEP": ["COGEP"], "GDGPC": ["GDGPC"], "AESP": ["AESP"], "COAFI": ["COAFI"], "CIOPAER": ["CIOPAER"], "ASCON": ["ASCON"], "COREG": ["COREG"]
};
const AIS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24, 25];
const DPC_LIST = ["KLEVER FARIAS", "ALCEU VIANA", "HUGGO LEONARDO", "LUIS JUNIOR", "EVNA AMERICA", "ROBERTA FROTA", "JOÃO GABRIEL", "KEYLA LACERDA", "WILSON CAMELO", "JULIUS BERNARDO"];
const OIP_LIST = ["JARBAS", "LUCAS", "PAULO JUNIOR", "ALEX", "ROGERIO", "JOÃO PAULO"];
const BRIEFING_LOCATIONS = ["Polícia Civil - CISP", ...DEPARTMENTS.DPC];

// --- FUNÇÕES AUXILIARES DE FORMATAÇÃO E VALIDAÇÃO ---
const normalizeName = (name) => !name ? '' : name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const formatMatricula = (matricula) => !matricula ? '' : matricula.toUpperCase().replace(/[^0-9X]/g, '').substring(0, 8);
const displayMatricula = (matricula) => !matricula ? '' : matricula.padStart(8, '0').replace(/(\d{3})(\d{3})(\d{1})(\d{1})/, '$1.$2-$3-$4');
const formatPlaca = (value) => {
    let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
    return v.slice(0, 8);
};
const formatTelefone = (value) => !value ? "" : value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) ').replace(/(\d{5})(\d)/, '$1.$2').substring(0, 15);
const formatProcedimento = (value) => value.toUpperCase().replace(/[^0-9/]/g, '').replace(/^(\d{3})/, '$1-').substring(0, 12);

// --- FUNÇÕES AUXILIARES DE DATA ---
const getCycleInfo = (date = new Date()) => {
    const day = date.getDate(), month = date.getMonth(), year = date.getFullYear();
    if (day >= 21) return { cycleId: `${year}-${String(month + 1).padStart(2, '0')}` };
    return { cycleId: `${year}-${String(month).padStart(2, '0')}` };
};
const getWeekInfo = (date = new Date()) => {
    const current = new Date(date); current.setHours(0, 0, 0, 0);
    const dayOfWeek = current.getDay();
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));
    const week = Array.from({length: 7}, (_, i) => { const day = new Date(monday); day.setDate(monday.getDate() + i); return day; });
    const weekNumber = Math.ceil((((monday - new Date(monday.getFullYear(), 0, 1)) / 86400000) + new Date(monday.getFullYear(), 0, 1).getDay() + 1) / 7);
    return { weekId: `${monday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`, weekDays: week };
};

// --- COMPONENTES DA UI ---
const LoadingSpinner = () => <div className="flex justify-center items-center h-full w-full"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div></div>;
const Modal = ({ children, onClose, size = '3xl' }) => <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"><div className={`bg-gray-100 rounded-2xl shadow-2xl w-full max-w-${size} max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in-up`}><button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"><XSquare size={28} /></button>{children}</div></div>;
const Notification = ({ message, type, onDismiss }) => {
    React.useEffect(() => {
        if (message) {
            const timer = setTimeout(() => onDismiss(), 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    if (!message) return null;

    const typeClasses = { success: "bg-green-500", error: "bg-red-500", info: "bg-blue-500", warning: "bg-yellow-500" };
    return (<div className={`fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white z-[100] animate-fade-in-down ${typeClasses[type]}`} onClick={onDismiss}>{message}</div>);
};

// --- COMPONENTE PRINCIPAL: App ---
export default function App() {
    const [user, setUser] = React.useState(null);
    const [userData, setUserData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [currentPage, setCurrentPage] = React.useState('dashboard');
    const [notification, setNotification] = React.useState({ message: '', type: '' });

    React.useEffect(() => {
        const jspdfScript = document.createElement('script'); jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; jspdfScript.async = true; document.body.appendChild(jspdfScript);
        const html2canvasScript = document.createElement('script'); html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; html2canvasScript.async = true; document.body.appendChild(html2canvasScript);
        return () => { if (document.body.contains(jspdfScript)) document.body.removeChild(jspdfScript); if (document.body.contains(html2canvasScript)) document.body.removeChild(html2canvasScript); }
    }, []);

    React.useEffect(() => {
        if (!firebaseConfig.apiKey) {
            setNotification({ message: "Configuração do Firebase não encontrada. Verifique as variáveis de ambiente.", type: 'error' });
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, `/artifacts/${appId}/users`, firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) setUserData({ uid: firebaseUser.uid, ...userDocSnap.data() });
                else {
                    const newUser = { uid: firebaseUser.uid, nome: 'ADMIN TESTE', matricula: '12345678', departamento: 'GDGPC', delegacia: 'GDGPC', telefone: '(85) 98888.8888', role: 'admin' };
                    await setDoc(userDocRef, newUser);
                    setUserData(newUser);
                }
                setUser(firebaseUser);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) { console.error("Erro na autenticação anônima:", error); setNotification({ message: "Falha na autenticação. Verifique a configuração do Firebase.", type: 'error' }); }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const showNotification = (message, type = 'info') => setNotification({ message, type });

    if (loading) return <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center"><img src={PCCE_LOGO_URL} alt="Brasão PCCE" className="h-24 w-24 animate-pulse" /><h1 className="text-3xl font-bold mt-4">Sistema EGIDE</h1><p className="text-lg text-gray-400">Carregando...</p><LoadingSpinner /></div>;

    return (
        <div className="bg-gray-800 text-white min-h-screen font-sans">
            <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: '' })} />
            <Header user={userData} setCurrentPage={setCurrentPage} currentPage={currentPage} />
            <main className="p-4 md:p-8">
                {userData?.role === 'admin' && currentPage === 'admin' ? <AdminDashboard userData={userData} showNotification={showNotification} /> : <OfficerDashboard user={userData} showNotification={showNotification} />}
            </main>
        </div>
    );
}

// --- CABEÇALHO ---
const Header = ({ user, setCurrentPage, currentPage }) => (
    <header className="bg-gray-900/80 backdrop-blur-sm shadow-lg p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center space-x-4"><img src={PCCE_LOGO_URL} alt="Brasão PCCE" className="h-16" /><div className="hidden sm:block"><h1 className="text-2xl font-bold text-white">EGIDE</h1><p className="text-sm text-gray-400">Polícia Civil do Estado do Ceará</p></div></div>
        <nav className="flex items-center space-x-2 sm:space-x-4">
            {user?.role === 'admin' && (<><button onClick={() => setCurrentPage('dashboard')} className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${currentPage === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>Painel Policial</button><button onClick={() => setCurrentPage('admin')} className={`px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${currentPage === 'admin' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>Painel Admin</button></>)}
            <div className="text-right"><p className="font-semibold text-sm sm:text-base">{user?.nome.split(' ')[0]}</p><p className="text-xs text-gray-400 hidden sm:block">Mat. {displayMatricula(user?.matricula)}</p></div>
            <button className="p-2 rounded-full hover:bg-gray-700 transition-colors"><LogOut size={20} /></button>
        </nav>
    </header>
);

// --- PAINEL DO POLICIAL ---
function OfficerDashboard({ user, showNotification }) {
    const [currentWeek, setCurrentWeek] = React.useState(getWeekInfo());
    const [vagas, setVagas] = React.useState([]);
    const [myTeam, setMyTeam] = React.useState(null);
    const [myConvoy, setMyConvoy] = React.useState(null);
    const [convoyReport, setConvoyReport] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [modalContent, setModalContent] = React.useState(null);
    const [showHistory, setShowHistory] = React.useState(false);

    React.useEffect(() => {
        if (!user) return;
        setLoading(true);
        const unsubscribes = [];
        
        const vagasQuery = query(collection(db, `/artifacts/${appId}/public/data/vagas`), where("weekId", "==", currentWeek.weekId));
        unsubscribes.push(onSnapshot(vagasQuery, (snap) => setVagas(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

        const teamsQuery = query(collection(db, `/artifacts/${appId}/public/data/teams`), where("weekId", "==", currentWeek.weekId), where("memberMatriculas", "array-contains", user.matricula));
        unsubscribes.push(onSnapshot(teamsQuery, async (teamSnap) => {
            if (!teamSnap.empty) {
                const teamData = { id: teamSnap.docs[0].id, ...teamSnap.docs[0].data() };
                setMyTeam(teamData);
                
                const convoyQuery = query(collection(db, `/artifacts/${appId}/public/data/convoys`), where("teamIds", "array-contains", teamData.id));
                const convoySnap = await getDocs(convoyQuery);
                
                if(!convoySnap.empty) {
                    const convoyData = { id: convoySnap.docs[0].id, ...convoySnap.docs[0].data() };
                    setMyConvoy(convoyData);
                    
                    const reportQuery = query(collection(db, `/artifacts/${appId}/public/data/convoyReports`), where("convoyId", "==", convoyData.id));
                    const reportSnap = await getDocs(reportQuery);
                    setConvoyReport(reportSnap.empty ? null : {id: reportSnap.docs[0].id, ...reportSnap.docs[0].data()});
                } else {
                    setMyConvoy(null);
                    setConvoyReport(null);
                }
            } else {
                setMyTeam(null);
                setMyConvoy(null);
                setConvoyReport(null);
            }
            setLoading(false);
        }));

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, currentWeek]);

    const handleRegister = async (vaga, teamData) => {
        if (myTeam) { showNotification("Você já está escalado esta semana.", "error"); return; }
        
        const cycleId = getCycleInfo(new Date()).cycleId;
        if (vaga.shiftType === 'day') {
            for (const member of teamData.members) {
                const q = query(collection(db, `/artifacts/${appId}/public/data/teams`), where("cycleId", "==", cycleId), where("vagaShiftType", "==", "day"), where("memberMatriculas", "array-contains", member.matricula));
                if (!(await getDocs(q)).empty) {
                    showNotification(`Policial ${member.nome} já cumpriu uma escala de 12h neste ciclo.`, 'error');
                    return;
                }
            }
        }

        for (const member of teamData.members) {
            if(member.matricula === user.matricula) continue;
            const q = query(collection(db, `/artifacts/${appId}/public/data/teams`), where("weekId", "==", currentWeek.weekId), where("memberMatriculas", "array-contains", member.matricula));
            if (!(await getDocs(q)).empty) {
                const alertMsg = `Policial ${member.nome} já está escalado esta semana.`;
                showNotification(alertMsg, 'warning');
                await addDoc(collection(db, `/artifacts/${appId}/public/data/alerts`), { type: 'POSSIVEL_BURLA', message: alertMsg, details: { offendingOfficer: member }, createdAt: new Date(), weekId: currentWeek.weekId, status: 'new' });
                return;
            }
        }
        try {
            const newTeamRef = doc(collection(db, `/artifacts/${appId}/public/data/teams`));
            const team = { id: newTeamRef.id, vagaId: vaga.id, vagaDate: vaga.date, vagaShiftType: vaga.shiftType, weekId: currentWeek.weekId, cycleId: getCycleInfo(new Date(vaga.date.seconds * 1000)).cycleId, registeringOfficer: { uid: user.uid, nome: user.nome, delegacia: user.delegacia }, members: teamData.members, memberMatriculas: teamData.members.map(m => m.matricula), vehicle: teamData.vehicle, chefeEquipeTelefone: teamData.telefone, status: 'Registrada', delegaciaPrincipal: user.delegacia, };
            const vagaDocRef = doc(db, `/artifacts/${appId}/public/data/vagas`, vaga.id);
            const batch = writeBatch(db);
            batch.set(newTeamRef, team);
            batch.update(vagaDocRef, { status: 'Ocupada', teamId: newTeamRef.id });
            await batch.commit();
            showNotification("Equipe registrada com sucesso!", "success");
            setModalContent(null);
        } catch (error) { console.error(error); showNotification("Falha ao registrar equipe.", "error"); }
    };

    const handleReportSubmit = async (reportData) => {
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/convoyReports`), reportData);
            showNotification("Relatório do Comboio enviado com sucesso!", "success");
            setModalContent(null);
        } catch(error) { console.error(error); showNotification("Falha ao enviar relatório.", "error"); }
    };

    const handleExportPDF = (report, convoy, teams) => {
        if (typeof window.jspdf === 'undefined' || typeof window.html2canvas === 'undefined') { showNotification("Bibliotecas de PDF carregando. Tente novamente.", "info"); return; }
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const tempContainer = document.createElement('div');
        tempContainer.className = "fixed -left-[2000px] top-0 w-[800px] text-black bg-white p-10 font-sans";
        const allMembers = teams.map(t => t.members).flat();
        const reportHTML = `<div id="pdf-content" class="text-sm">...</div>`; // PDF Generation logic to be updated with new report structure
        tempContainer.innerHTML = reportHTML;
        document.body.appendChild(tempContainer);
        html2canvas(tempContainer.querySelector('#pdf-content')).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio_comboio_${convoy.id.substring(0,5)}.pdf`);
            document.body.removeChild(tempContainer);
            showNotification("Relatório PDF gerado!", "success");
        });
    };

    const renderModalContent = () => {
        if (!modalContent) return null;
        switch (modalContent.type) {
            case 'register': return <RegistrationForm vaga={modalContent.vaga} user={user} onSubmit={handleRegister} onCancel={() => setModalContent(null)} showNotification={showNotification} />;
            case 'reportConvoy': return <ConvoyReportForm convoy={myConvoy} user={user} onSubmit={handleReportSubmit} onCancel={() => setModalContent(null)} />;
            case 'viewConvoyReport': return <ViewReport report={convoyReport} onExportPDF={() => {}} onCancel={() => setModalContent(null)} />;
            default: return null;
        }
    };
    
    const vagasByDay = vagas.reduce((acc, vaga) => { const dayKey = new Date(vaga.date.seconds * 1000).toDateString(); if (!acc[dayKey]) acc[dayKey] = []; acc[dayKey].push(vaga); return acc; }, {});
    const sortedDays = Object.keys(vagasByDay).sort((a,b) => new Date(a) - new Date(b));
    const isLeaderInConvoy = myConvoy && myConvoy.teamIds.includes(myTeam?.id) && myTeam?.registeringOfficer.uid === user.uid;

    return (
        <div>
            {modalContent && <Modal size="5xl" onClose={() => setModalContent(null)}>{renderModalContent()}</Modal>}
            {showHistory && <Modal size="5xl" onClose={() => setShowHistory(false)}><ServiceHistoryView user={user} /></Modal>}
            <div className="mb-8 p-6 bg-gray-900/50 rounded-xl shadow-lg">
                <div className="flex justify-between items-start"><h2 className="text-2xl font-bold text-blue-400 mb-4">Meu Status da Semana</h2><button onClick={() => setShowHistory(true)} className="flex items-center space-x-2 text-sm text-blue-300 hover:text-blue-100"><History size={18} /><span>Meu Histórico</span></button></div>
                {loading ? <LoadingSpinner /> : myTeam ? (
                    <div className="text-lg"><p>Você está escalado para <span className="font-bold text-green-400">{new Date(myTeam.vagaDate.seconds * 1000).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}</span>.</p>
                        {myConvoy && <p>Sua equipe foi alocada no Comboio da AIS {myConvoy.ais}.</p>}
                        <div className="mt-4 flex space-x-4">
                            {isLeaderInConvoy && !convoyReport && <button onClick={() => setModalContent({ type: 'reportConvoy' })} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><FileText size={20} /><span>Preencher Relatório do Comboio</span></button>}
                            {convoyReport && <button onClick={() => setModalContent({ type: 'viewConvoyReport' })} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><FileText size={20} /><span>Ver Relatório do Comboio</span></button>}
                        </div>
                    </div>
                ) : ( <p className="text-lg text-gray-300">Você não está escalado esta semana.</p> )}
            </div>
            <h2 className="text-3xl font-bold mb-4 text-center">Vagas Disponíveis - Semana de {currentWeek.weekDays[0].toLocaleDateString('pt-BR')} a {currentWeek.weekDays[6].toLocaleDateString('pt-BR')}</h2>
            {loading ? <LoadingSpinner /> : (
                <div className="space-y-6">
                    {sortedDays.map(dayKey => {
                        const dayVagas = vagasByDay[dayKey];
                        const dayDate = new Date(dayKey);
                        const disponiveis = dayVagas.filter(v => v.status === 'Disponível').length;
                        return (
                            <div key={dayKey} className="bg-gray-900 p-4 rounded-lg"><h4 className="text-lg font-bold text-blue-400 capitalize flex justify-between"><span>{dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}</span><span>{disponiveis} vagas disponíveis</span></h4>
                                <div className="mt-2 overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-400 uppercase"><tr><th className="px-4 py-2">Horário</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Ação</th></tr></thead>
                                    <tbody>{dayVagas.sort((a,b) => a.shiftType.localeCompare(b.shiftType)).map(vaga => (<tr key={vaga.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-4 py-2">{vaga.shiftType === 'day' ? '08h-20h' : '19h-01h'}</td>
                                        <td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${vaga.status === 'Disponível' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{vaga.status}</span></td>
                                        <td className="px-4 py-2 text-right">{vaga.status === 'Disponível' && !myTeam && (<button onClick={() => setModalContent({ type: 'register', vaga })} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-xs">Registrar</button>)} {vaga.status !== 'Disponível' && <span className="text-gray-500 text-xs">Ocupada</span>}</td>
                                    </tr>))}</tbody>
                                </table></div>
                            </div>
                        );
                    })}
                    {sortedDays.length === 0 && !loading && (<p className="text-center text-gray-400 pt-4">Nenhuma vaga para esta semana.</p>)}
                </div>
            )}
        </div>
    );
}

const RegistrationForm = ({ vaga, user, onSubmit, onCancel, showNotification }) => {
    const [team, setTeam] = React.useState([ { nome: user.nome, matricula: user.matricula, departamento: user.departamento, delegacia: user.delegacia, telefone: user.telefone || '', uid: user.uid }, { nome: '', matricula: '', departamento: '', delegacia: '' }, { nome: '', matricula: '', departamento: '', delegacia: '' }, ]);
    const [vehicle, setVehicle] = React.useState('');
    const handleMemberChange = (index, field, value) => {
        const newTeam = [...team];
        newTeam[index][field] = value;
        if (field === 'departamento') newTeam[index]['delegacia'] = '';
        if (field === 'nome') newTeam[index][field] = normalizeName(value);
        if (field === 'matricula') newTeam[index][field] = formatMatricula(value);
        if (field === 'telefone') newTeam[index][field] = formatTelefone(value);
        setTeam(newTeam);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const finalTeam = team.map(m => ({ ...m, matricula: formatMatricula(m.matricula) }));
        if (finalTeam.some(m => !m.nome || m.matricula.length < 7 || !m.delegacia) || !vehicle || team[0].telefone.length < 15) {
            showNotification("Preencha todos os campos, incluindo telefone do líder e placa da viatura no formato correto.", "error");
            return;
        }
        onSubmit(vaga, { members: finalTeam, vehicle, telefone: team[0].telefone });
    };
    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Registrar Equipe para Serviço</h2>
            <p className="mb-6 text-gray-600">Dia: <span className="font-semibold">{new Date(vaga.date.seconds * 1000).toLocaleDateString('pt-BR', { dateStyle: 'full' })}</span></p>
            {team.map((member, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                    <h3 className="font-bold text-lg mb-2 text-gray-700">Componente {index + 1} {index === 0 ? "(Chefe da Equipe)" : ""}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="NOME COMPLETO" value={member.nome} onChange={(e) => handleMemberChange(index, 'nome', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 uppercase" required />
                        <div><input type="text" placeholder="MATRÍCULA" value={member.matricula} onChange={(e) => handleMemberChange(index, 'matricula', e.target.value)} maxLength="8" className="w-full p-2 border rounded-md text-gray-800" required /><small className="text-gray-500">Formato final: {displayMatricula(member.matricula)}</small></div>
                        <select value={member.departamento} onChange={(e) => handleMemberChange(index, 'departamento', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required><option value="">SELECIONE O DEPARTAMENTO</option>{Object.keys(DEPARTMENTS).map(dep => <option key={dep} value={dep}>{dep}</option>)}</select>
                        <select value={member.delegacia} onChange={(e) => handleMemberChange(index, 'delegacia', e.target.value)} className="w-full p-2 border rounded-md text-gray-800 bg-white" required disabled={!member.departamento}><option value="">SELECIONE A DELEGACIA</option>{member.departamento && DEPARTMENTS[member.departamento].map(del => <option key={del} value={del}>{del}</option>)}</select>
                        {index === 0 && <div><label className="block text-sm font-medium text-gray-700">Telefone do Chefe da Equipe</label><input type="tel" placeholder="(XX) XXXXX.XXXX" value={member.telefone} onChange={(e) => handleMemberChange(index, 'telefone', e.target.value)} maxLength="15" className="w-full p-2 border rounded-md text-gray-800" required /></div>}
                    </div>
                </div>
            ))}
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white"><h3 className="font-bold text-lg mb-2 text-gray-700">Viatura</h3><input type="text" placeholder="PLACA (ABC-1234)" value={vehicle} onChange={(e) => setVehicle(formatPlaca(e.target.value))} maxLength="8" className="w-full p-2 border rounded-md text-gray-800 uppercase" required /></div>
            <div className="flex justify-end space-x-4"><button type="button" onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button><button type="submit" className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">Confirmar Registro</button></div>
        </form>
    );
};

const ConvoyReportForm = ({ convoy, user, onSubmit, onCancel }) => {
    // This is a placeholder for the new complex form.
    // The actual implementation will be much more detailed.
    const [summary, setSummary] = React.useState('');
    const handleSubmit = () => {
        // Complex data aggregation will happen here
        const reportData = {
            convoyId: convoy.id,
            // ... all the fields from the user request
            summary,
            submittedBy: user.uid,
            submittedAt: new Date(),
        };
        onSubmit(reportData);
    };
    return (
        <div className="text-gray-800">
            <h2 className="text-2xl font-bold mb-4">Relatório do Comboio</h2>
            <p><strong>AIS:</strong> {convoy.ais}</p>
            <p><strong>Bairro:</strong> {convoy.bairro}</p>
            <p><strong>Missão:</strong> {convoy.mission}</p>
            <p className="font-bold mt-4">Preencha os resultados da operação:</p>
            {/* All the detailed form fields would go here */}
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows="5" className="w-full p-2 border rounded mt-2" placeholder="Resumo e concatenação dos dados..."></textarea>
            <div className="flex justify-end space-x-4 mt-4">
                <button onClick={onCancel} className="py-2 px-6 bg-gray-500 text-white rounded">Cancelar</button>
                <button onClick={handleSubmit} className="py-2 px-6 bg-green-600 text-white rounded">Enviar Relatório</button>
            </div>
        </div>
    );
};

const ViewReport = ({ report, onExportPDF, onCancel }) => (
    <div className="text-gray-800">
        <h2 className="text-2xl font-bold mb-4">Relatório Enviado</h2>
        <div className="space-y-4 bg-white p-6 rounded-lg">{Object.entries(report).map(([key, value]) => { if (['teamId', 'vagaId', 'weekId', 'cycleId', 'submittedBy', 'id'].includes(key)) return null; return ( <div key={key}> <h4 className="font-bold capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</h4> <p className="ml-2">{typeof value === 'object' && value.seconds ? new Date(value.seconds * 1000).toLocaleString('pt-BR') : value.toString()}</p> </div> ) })}</div>
        <div className="flex justify-end space-x-4 mt-6"> <button onClick={onCancel} className="py-2 px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Fechar</button> <button onClick={onExportPDF} className="py-2 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center space-x-2"><Download size={18}/><span>Exportar PDF</span></button> </div>
    </div>
);

const ServiceHistoryView = ({ user }) => {
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [expandedRows, setExpandedRows] = React.useState([]);
    const toggleRow = (id) => setExpandedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    React.useEffect(() => {
        const fetchHistory = async () => {
            const q = query(collection(db, `/artifacts/${appId}/public/data/teams`), where("memberMatriculas", "array-contains", user.matricula));
            const snap = await getDocs(q);
            setHistory(snap.docs.map(d => d.data()).sort((a, b) => b.vagaDate.seconds - a.vagaDate.seconds));
            setLoading(false);
        };
        fetchHistory();
    }, [user]);
    return (
        <div className="text-gray-800"><h2 className="text-2xl font-bold mb-4">Meu Histórico de Serviços</h2>
            {loading ? <LoadingSpinner /> : (<div className="overflow-x-auto max-h-[60vh]"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-700 uppercase bg-gray-200 sticky top-0"><tr><th className="px-4 py-2 w-12"></th><th className="px-4 py-2">Data</th><th className="px-4 py-2">Horário</th><th className="px-4 py-2">Chefe da Equipe</th><th className="px-4 py-2">Viatura</th></tr></thead>
                <tbody>{history.map(team => (<React.Fragment key={team.id}><tr className="border-b hover:bg-gray-200 cursor-pointer" onClick={() => toggleRow(team.id)}><td className="px-4 py-2 text-center">{expandedRows.includes(team.id) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</td><td className="px-4 py-2">{new Date(team.vagaDate.seconds * 1000).toLocaleDateString('pt-BR')}</td><td className="px-4 py-2">{team.vagaShiftType === 'day' ? '08h-20h' : '19h-01h'}</td><td className="px-4 py-2">{team.registeringOfficer.nome}</td><td className="px-4 py-2">{team.vehicle}</td></tr>
                {expandedRows.includes(team.id) && (
                    <tr className="bg-gray-100"><td colSpan="5" className="p-3"><div className="p-2 bg-white rounded">
                        <h5 className="font-bold mb-1">Componentes da Equipe:</h5>
                        <ul className="list-disc list-inside text-xs">{team.members.map(m => <li key={m.matricula}>{m.nome} ({displayMatricula(m.matricula)}) - {m.delegacia}</li>)}</ul>
                    </div></td></tr>
                )}
                </React.Fragment>))}</tbody>
            </table></div>)}
        </div>
    );
};

// --- PAINEL DO ADMINISTRADOR ---
function AdminDashboard({ userData, showNotification }) {
    const [view, setView] = React.useState('dashboard');
    const [currentWeek, setCurrentWeek] = React.useState(getWeekInfo());
    const [vagas, setVagas] = React.useState([]);
    const [teams, setTeams] = React.useState([]);
    const [convoys, setConvoys] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const viewNames = { dashboard: 'Dashboard', schedule: 'Escalas', convoys: 'Criação da Operação', alerts: 'Alertas', users: 'Usuários', holidays: 'Feriados' };
    React.useEffect(() => {
        setLoading(true);
        const unsubscribes = [
            onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/vagas`), where("weekId", "==", currentWeek.weekId)), snap => setVagas(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
            onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/teams`), where("weekId", "==", currentWeek.weekId)), snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))),
            onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/convoys`), where("weekId", "==", currentWeek.weekId)), snap => { setConvoys(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); }, err => { console.error(err); setLoading(false); showNotification("Erro ao carregar dados.", "error"); })
        ];
        return () => unsubscribes.forEach(unsub => unsub());
    }, [currentWeek, showNotification]);

    const generateWeeklyVagas = async () => {
        if (vagas.length > 0) { showNotification("Vagas já geradas.", "info"); return; }
        const holidaysSnap = await getDocs(collection(db, `/artifacts/${appId}/public/data/holidays`));
        const holidayDates = holidaysSnap.docs.map(d => new Date(d.data().date.seconds * 1000).toDateString());
        const vagasRules = { 1: 4, 2: 3, 3: 3, 4: 3, 5: 6, 6: 5, 0: 5 };
        const batch = writeBatch(db);
        const vagasCollectionRef = collection(db, `/artifacts/${appId}/public/data/vagas`);
        currentWeek.weekDays.forEach(day => {
            const dayOfWeek = day.getDay();
            const isHoliday = holidayDates.includes(day.toDateString());
            if (isHoliday || [0, 6].includes(dayOfWeek)) {
                for(let i = 0; i < 2; i++) batch.set(doc(vagasCollectionRef), { date: day, weekId: currentWeek.weekId, shiftType: 'day', status: 'Disponível' });
                for(let i = 0; i < (vagasRules[dayOfWeek] * 2); i++) batch.set(doc(vagasCollectionRef), { date: day, weekId: currentWeek.weekId, shiftType: 'night', status: 'Disponível' });
            } else {
                for (let i = 0; i < (vagasRules[dayOfWeek] * 2); i++) batch.set(doc(vagasCollectionRef), { date: day, weekId: currentWeek.weekId, shiftType: 'night', status: 'Disponível' });
            }
        });
        try { await batch.commit(); showNotification("Vagas da semana geradas!", "success"); } 
        catch (error) { console.error(error); showNotification("Falha ao gerar vagas.", "error"); }
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded-xl">
            <h2 className="text-3xl font-bold text-blue-400 mb-4">Painel do Administrador</h2>
            <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 mb-6 overflow-x-auto pb-2">
                {Object.keys(viewNames).map(v => <button key={v} onClick={() => setView(v)} className={`py-2 px-4 whitespace-nowrap capitalize ${view === v ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>{viewNames[v]}</button>)}
            </div>
            {loading ? <LoadingSpinner /> : (<>
                {vagas.length === 0 && !['dashboard', 'users', 'holidays'].includes(view) && (<div className="text-center p-8 bg-gray-800 rounded-lg"><h3 className="text-xl font-semibold mb-4">Nenhuma vaga para esta semana.</h3><button onClick={generateWeeklyVagas} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2"><PlusCircle size={22} /> <span>Gerar Vagas</span></button></div>)}
                {view === 'dashboard' && <ReportsDashboardView showNotification={showNotification} />}
                {view === 'schedule' && <ScheduleManagementView vagas={vagas} teams={teams} />}
                {view === 'convoys' && <ConvoyManagementView teams={teams} convoys={convoys} weekId={currentWeek.weekId} showNotification={showNotification} />}
                {view === 'alerts' && <AlertsView showNotification={showNotification} />}
                {view === 'users' && <UserManagementView userData={userData} showNotification={showNotification} />}
                {view === 'holidays' && <HolidayManagementView showNotification={showNotification} />}
            </>)}
        </div>
    );
}

const ScheduleManagementView = ({ vagas, teams }) => {
    const [expandedRows, setExpandedRows] = React.useState([]);
    const toggleRow = (id) => setExpandedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const vagasByDay = vagas.reduce((acc, vaga) => { const dayKey = new Date(vaga.date.seconds * 1000).toDateString(); if (!acc[dayKey]) acc[dayKey] = []; acc[dayKey].push(vaga); return acc; }, {});
    const sortedDays = Object.keys(vagasByDay).sort((a,b) => new Date(a) - new Date(b));
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Visão Geral das Escalas</h3>
            <div className="space-y-6">
                {sortedDays.map(dayKey => {
                    const dayVagas = vagasByDay[dayKey];
                    const dayDate = new Date(dayKey);
                    const preenchidas = dayVagas.filter(v => v.status === 'Ocupada').length;
                    return (
                        <div key={dayKey} className="bg-gray-800 p-4 rounded-lg">
                            <h4 className="text-lg font-bold text-blue-400 capitalize flex justify-between"><span>{dayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}</span><span>{preenchidas}/{dayVagas.length} vagas</span></h4>
                            <div className="mt-2 overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-400 uppercase"><tr><th className="px-4 py-2 w-12"></th><th className="px-4 py-2">Horário</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Chefe da Equipe</th><th className="px-4 py-2">Delegacia (Chefe)</th><th className="px-4 py-2">Viatura</th></tr></thead>
                                <tbody>{dayVagas.sort((a,b) => a.shiftType.localeCompare(b.shiftType)).map(vaga => { const team = teams.find(t => t.vagaId === vaga.id); return (<React.Fragment key={vaga.id}><tr className={`border-b border-gray-700 ${team ? 'cursor-pointer hover:bg-gray-700/50' : ''}`} onClick={() => team && toggleRow(vaga.id)}><td className="px-4 py-2 text-center">{team && (expandedRows.includes(vaga.id) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>)}</td><td className="px-4 py-2">{vaga.shiftType === 'day' ? '08h-20h' : '19h-01h'}</td><td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs font-bold ${vaga.status === 'Disponível' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{vaga.status}</span></td><td className="px-4 py-2">{team ? team.registeringOfficer.nome : '---'}</td><td className="px-4 py-2">{team ? team.delegaciaPrincipal : '---'}</td><td className="px-4 py-2">{team ? team.vehicle : '---'}</td></tr>
                                {team && expandedRows.includes(vaga.id) && (<tr className="bg-gray-900/50"><td colSpan="6" className="p-3"><div className="p-2 bg-gray-800 rounded"><h5 className="font-bold mb-1 text-white text-xs">COMPONENTES DA EQUIPE:</h5><ul className="list-disc list-inside text-xs">{team.members.map(m => <li key={m.matricula}>{m.nome} ({displayMatricula(m.matricula)}) - {m.delegacia}</li>)}</ul><p className="text-xs mt-1"><strong>Telefone do Chefe:</strong> {team.chefeEquipeTelefone || 'Não informado'}</p></div></td></tr>)}
                                </React.Fragment>); })}</tbody>
                            </table></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ConvoyManagementView = ({ teams, convoys, weekId, showNotification }) => {
    const [selectedTeams, setSelectedTeams] = React.useState([]);
    const [operationData, setOperationData] = React.useState({ dpc: '', oip: '', dpcOutro: '', oipOutro: '', localBriefing: '', localBriefingOutro: '' });
    const [assignmentData, setAssignmentData] = React.useState({ ais: '', bairro: '', mission: '' });
    const unassignedTeams = teams.filter(t => !convoys.some(c => c.teamIds.includes(t.id)));
    const handleSelectTeam = (teamId) => setSelectedTeams(prev => prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]);
    const handleChange = (setter, field, value) => setter(prev => ({ ...prev, [field]: value }));
    const handleCreateConvoy = async () => {
        if (selectedTeams.length !== 2) { showNotification("Selecione 2 equipes.", "error"); return; }
        if (!assignmentData.ais || (!operationData.oip || (operationData.oip === 'OUTRO' && !operationData.oipOutro)) || (!operationData.dpc || (operationData.dpc === 'OUTRO' && !operationData.dpcOutro)) || (!operationData.localBriefing || (operationData.localBriefing === 'OUTRO' && !operationData.localBriefingOutro))) { showNotification("Preencha todos os campos da operação e do comboio.", "error"); return; }
        try {
            const newConvoyRef = doc(collection(db, `/artifacts/${appId}/public/data/convoys`));
            const finalDpc = operationData.dpc === 'OUTRO' ? normalizeName(operationData.dpcOutro) : operationData.dpc;
            const finalOip = operationData.oip === 'OUTRO' ? normalizeName(operationData.oipOutro) : operationData.oip;
            const finalLocalBriefing = operationData.localBriefing === 'OUTRO' ? normalizeName(operationData.localBriefingOutro) : operationData.localBriefing;
            await setDoc(newConvoyRef, { id: newConvoyRef.id, weekId, date: teams.find(t => t.id === selectedTeams[0]).vagaDate, teamIds: selectedTeams, ...assignmentData, oip: finalOip, dpc: finalDpc, localBriefing: finalLocalBriefing, status: 'Formado' });
            showNotification("Comboio criado!", "success");
            setSelectedTeams([]); setAssignmentData({ ais: '', bairro: '', mission: '' });
        } catch (error) { console.error(error); showNotification("Falha ao criar comboio.", "error"); }
    };
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Criação da Operação</h3>
            <div className="bg-gray-800 p-4 rounded-lg mb-8">
                <h4 className="text-xl font-semibold mb-3">Dados Gerais da Operação do Dia</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block mb-1 font-semibold text-sm">DPC</label><select value={operationData.dpc} onChange={e => handleChange(setOperationData, 'dpc', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"><option value="">Selecione</option>{DPC_LIST.map(d => <option key={d} value={d}>{d}</option>)}<option value="OUTRO">OUTRO</option></select></div>
                    {operationData.dpc === 'OUTRO' && <div><label className="block mb-1 font-semibold text-sm">Outro DPC</label><input type="text" value={operationData.dpcOutro} onChange={e => handleChange(setOperationData, 'dpcOutro', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md uppercase"/></div>}
                    <div><label className="block mb-1 font-semibold text-sm">OIP</label><select value={operationData.oip} onChange={e => handleChange(setOperationData, 'oip', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"><option value="">Selecione</option>{OIP_LIST.map(o => <option key={o} value={o}>{o}</option>)}<option value="OUTRO">OUTRO</option></select></div>
                    {operationData.oip === 'OUTRO' && <div><label className="block mb-1 font-semibold text-sm">Outro OIP</label><input type="text" value={operationData.oipOutro} onChange={e => handleChange(setOperationData, 'oipOutro', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md uppercase"/></div>}
                    <div><label className="block mb-1 font-semibold text-sm">Local do Briefing</label><select value={operationData.localBriefing} onChange={e => handleChange(setOperationData, 'localBriefing', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"><option value="">Selecione</option>{BRIEFING_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}<option value="OUTRO">OUTRO</option></select></div>
                    {operationData.localBriefing === 'OUTRO' && <div><label className="block mb-1 font-semibold text-sm">Outro Local</label><input type="text" value={operationData.localBriefingOutro} onChange={e => handleChange(setOperationData, 'localBriefingOutro', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md uppercase"/></div>}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-4 rounded-lg"><h4 className="text-xl font-semibold mb-3">Equipes Disponíveis</h4><div className="space-y-3 max-h-96 overflow-y-auto">{unassignedTeams.map(team => (<div key={team.id} className={`p-3 rounded-lg border-2 ${selectedTeams.includes(team.id) ? 'border-blue-500 bg-blue-900/50' : 'border-transparent bg-gray-700'}`}><label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" checked={selectedTeams.includes(team.id)} onChange={() => handleSelectTeam(team.id)} className="form-checkbox h-5 w-5 text-blue-600" /><div><p className="font-bold">Chefe: {team.registeringOfficer.nome}</p><p className="text-sm">Viatura: {team.vehicle} | Dia: {new Date(team.vagaDate.seconds * 1000).toLocaleDateString()}</p></div></label></div>))}{unassignedTeams.length === 0 && <p className="text-gray-400">Nenhuma equipe disponível.</p>}</div></div>
                <div className="bg-gray-800 p-4 rounded-lg"><h4 className="text-xl font-semibold mb-3">Formar Novo Comboio</h4><div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block mb-1 font-semibold text-sm">AIS</label><select value={assignmentData.ais} onChange={e => handleChange(setAssignmentData, 'ais', e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"><option value="">Selecione</option>{AIS_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                        <div><label className="block mb-1 font-semibold text-sm">Bairro</label><input type="text" value={assignmentData.bairro} onChange={e => handleChange(setAssignmentData, 'bairro', e.target.value.toUpperCase())} className="w-full p-2 bg-gray-700 rounded-md uppercase" placeholder="BAIRRO"/></div>
                    </div>
                    <div><label className="block mb-1 font-semibold text-sm">Missão</label><textarea value={assignmentData.mission} onChange={e => handleChange(setAssignmentData, 'mission', e.target.value.toUpperCase())} className="w-full p-2 bg-gray-700 rounded-md uppercase" rows="2" placeholder="Ex: PATRULHAMENTO..."></textarea></div>
                    <button onClick={handleCreateConvoy} disabled={selectedTeams.length !== 2} className="w-full py-3 bg-green-600 hover:bg-green-700 font-bold rounded-lg transition disabled:bg-gray-500">Formar Comboio</button>
                </div></div>
            </div>
            <div className="mt-8"><h4 className="text-xl font-semibold mb-3">Comboios Formados</h4><div className="space-y-4">{convoys.map(convoy => (<div key={convoy.id} className="bg-gray-800 p-4 rounded-lg"><p className="font-bold text-lg text-blue-400">Comboio - {new Date(convoy.date.seconds * 1000).toLocaleDateString()}</p><p><span className="font-semibold">Área:</span> AIS {convoy.ais} - {convoy.bairro}</p><p><span className="font-semibold">Supervisão:</span> DPC {convoy.dpc} | OIP {convoy.oip}</p><p><span className="font-semibold">Briefing:</span> {convoy.localBriefing}</p><p className="font-semibold mt-2">Equipes:</p><ul className="list-disc list-inside ml-4">{convoy.teamIds.map(tid => { const team = teams.find(t => t.id === tid); return <li key={tid}>{team ? `Chefe ${team.registeringOfficer.nome} (Viatura: ${team.vehicle})` : 'Equipe não encontrada'}</li> })}</ul></div>))}{convoys.length === 0 && <p className="text-gray-400">Nenhum comboio formado.</p>}</div></div>
        </div>
    );
};

const ReportsDashboardView = ({ showNotification }) => {
    const [cycle, setCycle] = React.useState(getCycleInfo());
    const [reports, setReports] = React.useState([]);
    const [teams, setTeams] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [expandedOfficers, setExpandedOfficers] = React.useState([]);

    React.useEffect(() => {
        const reportsQuery = query(collection(db, `/artifacts/${appId}/public/data/reports`), where("cycleId", "==", cycle.cycleId));
        const teamsQuery = query(collection(db, `/artifacts/${appId}/public/data/teams`), where("cycleId", "==", cycle.cycleId));
        const unsubReports = onSnapshot(reportsQuery, (snap) => setReports(snap.docs.map(d => d.data())));
        const unsubTeams = onSnapshot(teamsQuery, (snap) => { setTeams(snap.docs.map(d => d.data())); setLoading(false); });
        return () => { unsubReports(); unsubTeams(); };
    }, [cycle]);

    const stats = reports.reduce((acc, report) => { Object.keys(report).forEach(key => { if(typeof report[key] === 'number') acc[key] = (acc[key] || 0) + report[key]; }); return acc; }, { pessoasAbordadas: 0, veiculosAbordados: 0, autosPrisao: 0, boletinsOcorrencia: 0, mandadosPrisao: 0, armasApreendidas: 0 });
    
    const officerHours = React.useMemo(() => {
        const reportedTeamIds = new Set(reports.map(r => r.teamId));
        const hoursMap = new Map();
        teams.filter(t => reportedTeamIds.has(t.id)).forEach(team => {
            const vagaDate = new Date(team.vagaDate.seconds * 1000);
            let startDate, endDate, hoursWorked;
            if (team.vagaShiftType === 'day') { startDate = new Date(vagaDate.setHours(8,0,0,0)); endDate = new Date(vagaDate.setHours(20,0,0,0)); hoursWorked = 12; } 
            else { startDate = new Date(vagaDate.setHours(19,0,0,0)); let nextDay = new Date(vagaDate); nextDay.setDate(vagaDate.getDate() + 1); endDate = new Date(nextDay.setHours(1,0,0,0)); hoursWorked = 6; }
            const service = { startDate, endDate, hours: hoursWorked };
            team.members.forEach(member => {
                const matricula = displayMatricula(member.matricula);
                if (!hoursMap.has(matricula)) hoursMap.set(matricula, { name: member.nome, services: [], totalHours: 0 });
                const officerData = hoursMap.get(matricula);
                officerData.services.push(service);
                officerData.totalHours += hoursWorked;
            });
        });
        return Array.from(hoursMap.entries()).map(([matricula, data]) => ({ matricula, ...data }));
    }, [reports, teams]);

    const toggleOfficerDetails = (matricula) => setExpandedOfficers(prev => prev.includes(matricula) ? prev.filter(m => m !== matricula) : [...prev, matricula]);
    
    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Matrícula,Nome,Data Início,Data Fim,Horas do Serviço\n";
        officerHours.forEach(officer => { officer.services.forEach(service => { csvContent += [`"${officer.matricula}"`, `"${officer.name}"`, `"${service.startDate.toLocaleString('pt-BR')}"`, `"${service.endDate.toLocaleString('pt-BR')}"`, service.hours].join(',') + '\n'; }); });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `relatorio_horas_${cycle.cycleId}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showNotification("Relatório de horas exportado.", "success");
    };

    if (loading) return <LoadingSpinner />;
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Dashboard do Ciclo ({cycle.cycleId})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">{Object.entries(stats).map(([key, value]) => (<div key={key} className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-3xl font-bold text-blue-400">{value}</p><p className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p></div>))}</div>
            <div className="bg-gray-800 p-4 rounded-lg"><div className="flex justify-between items-center mb-4"><h4 className="text-xl font-bold">Horas Extras por Policial</h4><button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><Download size={18} /><span>Exportar CSV</span></button></div>
                <div className="overflow-x-auto max-h-96"><table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase sticky top-0 bg-gray-800"><tr><th className="px-4 py-2 w-12"></th><th className="px-4 py-2">Matrícula</th><th className="px-4 py-2">Nome</th><th className="px-4 py-2 text-right">Total de Horas</th></tr></thead>
                    <tbody>
                        {officerHours.sort((a,b) => b.totalHours - a.totalHours).map(officer => (
                            <React.Fragment key={officer.matricula}>
                                <tr className="border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer" onClick={() => toggleOfficerDetails(officer.matricula)}>
                                    <td className="px-4 py-2 text-center"><button>{expandedOfficers.includes(officer.matricula) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button></td>
                                    <td className="px-4 py-2 font-mono">{officer.matricula}</td><td className="px-4 py-2">{officer.name}</td><td className="px-4 py-2 text-right font-bold">{officer.totalHours}h</td>
                                </tr>
                                {expandedOfficers.includes(officer.matricula) && (<tr className="bg-gray-900/50"><td colSpan="4" className="p-4">
                                    <h5 className="font-bold mb-2 text-white">Detalhes dos Serviços:</h5>
                                    <table className="w-full text-xs bg-gray-800 rounded"><thead className="text-gray-400"><tr><th className="px-3 py-1 text-left">Início</th><th className="px-3 py-1 text-left">Fim</th><th className="px-3 py-1 text-right">Horas</th></tr></thead>
                                        <tbody>{officer.services.map((service, index) => (<tr key={index} className="border-t border-gray-700"><td className="px-3 py-1">{service.startDate.toLocaleString('pt-BR')}</td><td className="px-3 py-1">{service.endDate.toLocaleString('pt-BR')}</td><td className="px-3 py-1 text-right">{service.hours}h</td></tr>))}</tbody>
                                    </table>
                                </td></tr>)}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table></div>
            </div>
        </div>
    );
};

const AlertsView = ({ showNotification }) => {
    const [alerts, setAlerts] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    React.useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/alerts`));
        const unsub = onSnapshot(q, (snap) => { setAlerts(snap.docs.map(d => ({id: d.id, ...d.data()}))); setLoading(false); });
        return () => unsub();
    }, []);
    const handleReview = async (id) => { await updateDoc(doc(db, `/artifacts/${appId}/public/data/alerts`, id), { status: 'reviewed' }); showNotification("Alerta revisado.", "success"); };
    if(loading) return <LoadingSpinner />;
    return (
        <div><h3 className="text-2xl font-bold mb-4">Painel de Alertas</h3><div className="space-y-4">
            {alerts.length === 0 && <p className="text-gray-400">Nenhum alerta registrado.</p>}
            {alerts.map(alert => (<div key={alert.id} className={`p-4 rounded-lg ${alert.status === 'new' ? 'bg-yellow-900/50 border-l-4 border-yellow-400' : 'bg-gray-800'}`}><div className="flex justify-between items-center"><div><p className="font-bold text-yellow-300">{alert.type.replace('_', ' ')}</p><p className="text-sm">{alert.message}</p><p className="text-xs text-gray-400">Em: {new Date(alert.createdAt.seconds * 1000).toLocaleString('pt-BR')}</p></div>{alert.status === 'new' && (<button onClick={() => handleReview(alert.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-xs">Revisado</button>)}</div></div>))}
        </div></div>
    );
};

const UserManagementView = ({ userData, showNotification }) => {
    const [users, setUsers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState(null);
    
    React.useEffect(() => {
        if (userData?.role !== 'admin') {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, `/artifacts/${appId}/users`));
        const unsub = onSnapshot(q, (snap) => {
            setUsers(snap.docs.map(d => ({id: d.id, ...d.data()})));
            setLoading(false);
        }, (error) => {
            console.error("Permission denied fetching users:", error);
            showNotification("Você não tem permissão para ver a lista de usuários.", "error");
            setLoading(false);
        });
        return () => unsub();
    }, [userData, showNotification]);

    const handleSaveUser = async (userDataToSave) => {
        const userRef = doc(db, `/artifacts/${appId}/users`, userDataToSave.id || doc(collection(db, `/artifacts/${appId}/users`)).id);
        await setDoc(userRef, userDataToSave, { merge: true });
        showNotification(`Policial ${editingUser ? 'atualizado' : 'salvo'} com sucesso!`, 'success');
        setModalOpen(false);
        setEditingUser(null);
    };
    if(loading) return <LoadingSpinner />;
    return (
        <div>
            {modalOpen && <Modal onClose={() => { setModalOpen(false); setEditingUser(null); }}><UserForm user={editingUser} onSave={handleSaveUser} /></Modal>}
            <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-bold">Gestão de Usuários</h3><button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"><UserPlus size={18}/><span>Novo Policial</span></button></div>
            <div className="overflow-x-auto bg-gray-800 rounded-lg"><table className="w-full text-sm text-left"><thead className="text-xs text-gray-400 uppercase"><tr><th className="px-4 py-2">Nome</th><th className="px-4 py-2">Matrícula</th><th className="px-4 py-2">Delegacia</th><th className="px-4 py-2">Perfil</th><th className="px-4 py-2">Ação</th></tr></thead>
                <tbody>{users.map(user => (<tr key={user.uid || user.id} className="border-b border-gray-700 hover:bg-gray-700/50"><td className="px-4 py-2">{user.nome}</td><td className="px-4 py-2">{displayMatricula(user.matricula)}</td><td className="px-4 py-2">{user.delegacia}</td><td className="px-4 py-2">{user.role}</td><td className="px-4 py-2"><button onClick={() => { setEditingUser(user); setModalOpen(true); }} className="text-blue-400 hover:text-blue-200"><Edit size={16}/></button></td></tr>))}</tbody>
            </table></div>
        </div>
    );
};

const UserForm = ({ user, onSave }) => {
    const [formData, setFormData] = React.useState({ nome: '', matricula: '', departamento: '', delegacia: '', telefone: '', role: 'policial', ...user });
    const handleChange = (field, value) => {
        const updatedData = { ...formData, [field]: value };
        if(field === 'departamento') updatedData.delegacia = '';
        if(field === 'telefone') updatedData.telefone = formatTelefone(value);
        setFormData(updatedData);
    };
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
            <h2 className="text-xl font-bold">{user ? 'Editar Policial' : 'Novo Policial'}</h2>
            <div><label>Nome</label><input type="text" value={formData.nome} onChange={e => handleChange('nome', normalizeName(e.target.value))} className="w-full p-2 border rounded mt-1 uppercase" required /></div>
            <div><label>Matrícula</label><input type="text" value={formData.matricula} onChange={e => handleChange('matricula', formatMatricula(e.target.value))} className="w-full p-2 border rounded mt-1" required /></div>
            <div><label>Telefone</label><input type="tel" value={formData.telefone} onChange={e => handleChange('telefone', e.target.value)} maxLength="15" className="w-full p-2 border rounded mt-1" required /></div>
            <div><label>Departamento</label><select value={formData.departamento} onChange={e => handleChange('departamento', e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required><option value="">Selecione...</option>{Object.keys(DEPARTMENTS).map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label>Delegacia</label><select value={formData.delegacia} onChange={e => handleChange('delegacia', e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required disabled={!formData.departamento}><option value="">Selecione...</option>{formData.departamento && DEPARTMENTS[formData.departamento].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            <div><label>Perfil</label><select value={formData.role} onChange={e => handleChange('role', e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required><option value="policial">Policial</option><option value="admin">Administrador</option></select></div>
            <div className="flex justify-end"><button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded-lg">Salvar</button></div>
        </form>
    );
};

const HolidayManagementView = ({ showNotification }) => {
    const [holidays, setHolidays] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [holidayName, setHolidayName] = React.useState('');
    const [holidayDate, setHolidayDate] = React.useState('');
    React.useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/holidays`));
        const unsub = onSnapshot(q, snap => { setHolidays(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.date.seconds - b.date.seconds)); setLoading(false); });
        return () => unsub();
    }, []);
    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if(!holidayName || !holidayDate) { showNotification("Preencha nome e data.", "error"); return; }
        await addDoc(collection(db, `/artifacts/${appId}/public/data/holidays`), { name: normalizeName(holidayName), date: new Date(holidayDate) });
        showNotification("Feriado adicionado!", "success");
        setHolidayName(''); setHolidayDate('');
    };
    const handleDelete = async (id) => { await deleteDoc(doc(db, `/artifacts/${appId}/public/data/holidays`, id)); showNotification("Feriado removido.", "success"); }
    if(loading) return <LoadingSpinner />;
    return (
        <div>
            <h3 className="text-2xl font-bold mb-4">Cadastro de Feriados</h3>
            <form onSubmit={handleAddHoliday} className="bg-gray-800 p-4 rounded-lg mb-6 flex items-end space-x-4">
                <div className="flex-grow"><label className="block text-sm font-bold mb-1">Nome do Feriado</label><input type="text" value={holidayName} onChange={e => setHolidayName(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"/></div>
                <div className="flex-grow"><label className="block text-sm font-bold mb-1">Data</label><input type="date" value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md"/></div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Adicionar</button>
            </form>
            <div className="bg-gray-800 p-4 rounded-lg"><h4 className="text-xl font-bold mb-2">Feriados Cadastrados</h4><div className="space-y-2">
                {holidays.map(h => (<div key={h.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-700/50"><span>{h.name} - {new Date(h.date.seconds * 1000).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span><button onClick={() => handleDelete(h.id)} className="text-red-400 hover:text-red-200"><Trash2 size={16}/></button></div>))}
            </div></div>
        </div>
    );
};
