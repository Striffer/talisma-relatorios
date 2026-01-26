
import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Table, 
  Image as ImageIcon, 
  Search, 
  Trash2, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  FileCode,
  Lock,
  User,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  ImageRun, 
  AlignmentType,
  patchDocument,
  PatchType,
  PageBreak
} from 'docx';
import saveAs from 'file-saver';
import { parseDocx, parseXlsx } from './utils/fileParsers';
import { ExtractionData, ReportHierarchy, MeasurementItem } from './types';

// Componente de Login
const AuthPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulação de autenticação com as credenciais: talisma / talisma@2026
    setTimeout(() => {
      if (username.toLowerCase() === 'talisma' && password === 'talisma@2026') {
        onLogin();
      } else {
        setError('Credenciais inválidas. Tente novamente.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portal Talismã</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Acesso Restrito</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="Seu usuário"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2 tracking-widest">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-600 mt-8 font-medium uppercase tracking-tighter">
            © 2024 Construtora Talismã LTDA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('talisma_auth') === 'true';
  });

  const [numMedicao, setNumMedicao] = useState('');
  const [periodoMedicao, setPeriodoMedicao] = useState('');
  const [docData, setDocData] = useState<ExtractionData | null>(null);
  const [reportRows, setReportRows] = useState<ReportHierarchy[]>([]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  
  const fileInputDocRef = useRef<HTMLInputElement>(null);
  const fileInputXlsRef = useRef<HTMLInputElement>(null);
  const fileInputTemplateRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    sessionStorage.setItem('talisma_auth', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    if (confirm("Deseja realmente sair do sistema?")) {
      sessionStorage.removeItem('talisma_auth');
      setIsAuthenticated(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await parseDocx(file);
      if (!data.contrato && !data.objeto) {
        throw new Error("Não foi possível extrair os dados do ofício automaticamente.");
      }
      setDocData(data);
    } catch (err: any) {
      setError(err.message || 'Falha na leitura do ofício.');
    } finally {
      setLoading(false);
    }
  };

  const handleXlsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await parseXlsx(file);
      if (data.length === 0) {
        throw new Error("Nenhum item com valor de medição maior que zero foi encontrado.");
      }
      setReportRows(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar planilha de medição.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setTemplateFile(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedItemId) return;
    const files = Array.from(e.target.files || []) as File[];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setPhotos(prev => ({
          ...prev,
          [selectedItemId]: [...(prev[selectedItemId] || []), url]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (itemId: string, index: number) => {
    setPhotos(prev => ({
      ...prev,
      [itemId]: prev[itemId].filter((_, i) => i !== index)
    }));
  };

  const filteredItems = useMemo(() => {
    const uniqueChildren = new Map<string, MeasurementItem>();
    reportRows.forEach(row => {
      const key = `${row.child.a}-${row.child.b}`;
      if (!uniqueChildren.has(key)) {
        uniqueChildren.set(key, row.child);
      }
    });
    return Array.from(uniqueChildren.values()).filter(item => 
      item.c.toLowerCase().includes(searchQuery.toLowerCase()) || item.b.includes(searchQuery)
    );
  }, [reportRows, searchQuery]);

  const base64ToUint8Array = (base64: string): Uint8Array => {
    try {
      const parts = base64.split(',');
      const binaryString = atob(parts.length > 1 ? parts[1] : parts[0]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      return new Uint8Array(0);
    }
  };

  const handleDownload = async () => {
    if (!docData || !reportRows.length) {
      setError("Importe os arquivos antes de gerar o relatório.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const reportContent: any[] = [];
      const fontArial = "Arial";
      const fontCourier = "Courier New";
      const colorBlack = "000000";

      reportContent.push(
        new Paragraph({
          children: [new TextRun({ text: "RELATÓRIO FOTOGRÁFICO", bold: true, size: 32, font: fontArial, color: colorBlack })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "Número da Medição: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: numMedicao, size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "Período da Medição: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: periodoMedicao, size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "Contrato: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: docData.contrato, size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "Contratada: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: "A CONSTRUTORA TALISMÃ LTDA", size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "CNPJ: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: "27.123.008/0001-00", size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "Responsável: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: "Aloísio Costa Vieira Júnior", size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "CPF: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: "158.911.567-84", size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "Email: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: "csc.construtorasulcapixaba@gmail.com", size: 24, font: fontArial, color: colorBlack })
          ] 
        }),
        new Paragraph({ 
          children: [
            new TextRun({ text: "Objeto: ", bold: true, size: 24, font: fontArial, color: colorBlack }),
            new TextRun({ text: docData.objeto, size: 24, font: fontArial, color: colorBlack })
          ], 
          spacing: { after: 400 } 
        }),
        new Paragraph({
          children: [new TextRun({ text: "Resumo do processo:", bold: true, size: 24, font: fontArial, color: colorBlack })],
        }),
        new Paragraph({
          children: [
            new TextRun({ 
              text: `${numMedicao} MEDIÇÃO ${periodoMedicao} – CONTRATO ${docData.contrato} – ${docData.objeto}`, 
              bold: false, 
              size: 24, 
              font: fontArial, 
              color: colorBlack 
            })
          ],
          spacing: { after: 600 },
        })
      );

      let lastGpKey = '';
      let lastPKey = '';

      for (let i = 0; i < reportRows.length; i++) {
        const row = reportRows[i];
        const itemPhotos = photos[row.child.b] || [];
        
        if (row.grandparent) {
          const currentGpKey = `${row.grandparent.a}|${row.grandparent.b}`;
          if (currentGpKey !== lastGpKey) {
            reportContent.push(
              new Paragraph({
                children: [
                  new TextRun({ 
                    text: `${row.grandparent.a} ${row.grandparent.b} ${row.grandparent.c}`, 
                    bold: true, 
                    size: 24, 
                    font: fontArial, 
                    color: colorBlack 
                  })
                ],
                spacing: { before: 0, after: 0, line: 240 },
              })
            );
            lastGpKey = currentGpKey;
            lastPKey = ''; 
          }
        }

        if (row.parent) {
          const currentPKey = `${row.parent.a}|${row.parent.b}`;
          if (currentPKey !== lastPKey) {
            reportContent.push(
              new Paragraph({
                children: [
                  new TextRun({ 
                    text: `${row.parent.a} ${row.parent.b} ${row.parent.c}`, 
                    bold: true, 
                    size: 24, 
                    font: fontArial, 
                    color: colorBlack 
                  })
                ],
                spacing: { before: 0, after: 0, line: 240 },
              })
            );
            lastPKey = currentPKey;
          }
        }

        reportContent.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: `${row.child.a} ${row.child.b} "${row.child.c}"`, 
                bold: false, 
                size: 24, 
                font: fontArial, 
                color: colorBlack 
              })
            ],
            spacing: { 
              before: 0, 
              after: itemPhotos.length > 0 ? 0 : 240, 
              line: 240 
            },
          })
        );

        if (itemPhotos.length > 0) {
          for (let j = 0; j < itemPhotos.length; j++) {
            const buffer = base64ToUint8Array(itemPhotos[j]);
            if (buffer.length === 0) continue;
            
            reportContent.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: buffer,
                    transformation: { width: 450, height: 337 },
                  } as any),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { 
                  before: 200, 
                  after: j === itemPhotos.length - 1 ? 240 : 200 
                },
              })
            );
          }
        }

        // Adiciona quebra de página após cada item (filho), exceto se for o último do loop
        if (i < reportRows.length - 1) {
          reportContent.push(new Paragraph({ children: [new PageBreak()] }));
        }
      }

      reportContent.push(
        new Paragraph({
          children: [new TextRun({ text: "________________________________________________", size: 24, font: fontCourier, color: colorBlack })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 800 },
        }),
        new Paragraph({ children: [new TextRun({ text: "A CONSTRUTORA TALISMÃ LTDA", size: 24, font: fontCourier, color: colorBlack })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: "CNPJ nº 27.123.008/0001-00", size: 24, font: fontCourier, color: colorBlack })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: "Aloísio Costa Vieira Júnior", size: 24, font: fontCourier, color: colorBlack })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: "CREA nº 20190900/ES", size: 24, font: fontCourier, color: colorBlack })], alignment: AlignmentType.CENTER })
      );

      let finalBlob: Blob;

      if (templateFile) {
        const templateArrayBuffer = await templateFile.arrayBuffer();
        finalBlob = await patchDocument({
          outputType: "blob",
          data: templateArrayBuffer,
          patches: {
            CONTEUDO: {
              type: PatchType.DOCUMENT,
              children: reportContent,
            },
          },
        });
      } else {
        const doc = new Document({
          sections: [{ children: reportContent }],
        });
        finalBlob = await Packer.toBlob(doc);
      }

      saveAs(finalBlob, `Relatorio_${numMedicao || 'Med'}.docx`);
    } catch (err: any) {
      setError('Erro ao gerar o relatório. Verifique se o template contém a tag {{CONTEUDO}}.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-slate-900 text-white py-6 px-4 mb-8 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-500/20">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Relatório Fotográfico</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Talismã Ltda</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={!docData || !reportRows.length || loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Gerar Relatório
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold py-3 px-5 rounded-xl transition-all border border-red-500/20"
              title="Sair do sistema"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="font-semibold text-sm">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">00. Modelo (Template)</h2>
              <input type="file" accept=".docx" onChange={handleTemplateUpload} ref={fileInputTemplateRef} className="hidden" />
              <button
                onClick={() => fileInputTemplateRef.current?.click()}
                className={`w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all ${
                  templateFile ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 hover:border-blue-300 text-slate-400'
                }`}
              >
                {templateFile ? <CheckCircle2 className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                <span className="text-xs font-bold uppercase">{templateFile ? 'Template Carregado' : 'Subir Template .docx'}</span>
              </button>
              <p className="text-[9px] text-slate-400 mt-2 text-center uppercase font-bold tracking-tight">
                Certifique-se que o arquivo tenha a tag <span className="text-blue-500">{"{{CONTEUDO}}"}</span>
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">01. Dados Básicos</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Número da Medição</label>
                  <input
                    type="text"
                    value={numMedicao}
                    onChange={(e) => setNumMedicao(e.target.value)}
                    placeholder="Ex: 01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Período</label>
                  <input
                    type="text"
                    value={periodoMedicao}
                    onChange={(e) => setPeriodoMedicao(e.target.value)}
                    placeholder="Ex: Jan a Fev/2024"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="pt-2">
                  <input type="file" accept=".docx" onChange={handleDocUpload} ref={fileInputDocRef} className="hidden" />
                  <button
                    onClick={() => fileInputDocRef.current?.click()}
                    className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3 transition-all ${
                      docData ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400'
                    }`}
                  >
                    {docData ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <FileText className="w-8 h-8" />}
                    <div className="text-center">
                      <span className="text-xs font-bold uppercase">{docData ? 'Ofício Carregado' : 'Carregar Ofício (.docx)'}</span>
                      {docData && <p className="text-[10px] mt-1 opacity-60 truncate px-2 max-w-[200px]">Contrato: {docData.contrato}</p>}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">02. Itens Medidos e Fotos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <input type="file" accept=".xlsx" onChange={handleXlsUpload} ref={fileInputXlsRef} className="hidden" />
                  <button
                    onClick={() => fileInputXlsRef.current?.click()}
                    className={`w-full h-full min-h-[160px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all ${
                      reportRows.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-400'
                    }`}
                  >
                    {reportRows.length > 0 ? <CheckCircle2 className="w-10 h-10 text-emerald-500" /> : <Table className="w-10 h-10" />}
                    <div className="text-center">
                      <p className="text-sm font-bold uppercase">{reportRows.length > 0 ? `${reportRows.length} Itens Medidos` : 'Planilha (.xlsx)'}</p>
                    </div>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar item..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm outline-none"
                    />
                  </div>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="">Selecione um item para fotos</option>
                    {filteredItems.map(item => {
                      const count = photos[item.b]?.length || 0;
                      return (
                        <option key={`${item.a}-${item.b}`} value={item.b}>
                          {count > 0 ? '✔️ ' : ''}{item.a} {item.b} - {item.c.substring(0, 50)}... {count > 0 ? `(${count})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <label className={`block w-full text-center py-3 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                    selectedItemId ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                  }`}>
                    <input type="file" multiple accept="image/*" disabled={!selectedItemId} onChange={handlePhotoUpload} className="hidden" />
                    <div className="flex items-center justify-center gap-2"><ImageIcon className="w-4 h-4" />Anexar Fotos</div>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Mural de Fotos</h3>
                {Object.keys(photos).length === 0 ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl py-16 flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon className="w-12 h-12 opacity-10 mb-4" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sem imagens anexadas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(Object.entries(photos) as [string, string[]][]).map(([itemId, itemPhotos]) => (
                      itemPhotos.map((url, idx) => (
                        <div key={`${itemId}-${idx}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm transition-transform hover:z-10 hover:scale-105">
                          <img src={url} className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <button onClick={() => removePhoto(itemId, idx)} className="bg-red-500 p-2.5 rounded-full text-white hover:bg-red-600 shadow-xl"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 text-[8px] text-white font-bold py-1.5 px-2 backdrop-blur-md">
                            <p className="truncate">{itemId}</p>
                          </div>
                        </div>
                      ))
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center z-50">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center gap-6">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            <p className="text-slate-900 font-black tracking-widest text-[10px] uppercase">Processando Documento</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
