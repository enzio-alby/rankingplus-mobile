import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_URL } from '@/config';
import { getToken } from '@/api/client';

const _MIME = {
  pdf: { mime: 'application/pdf', uti: 'com.adobe.pdf' },
  jpg: { mime: 'image/jpeg', uti: 'public.jpeg' },
  jpeg: { mime: 'image/jpeg', uti: 'public.jpeg' },
  png: { mime: 'image/png', uti: 'public.png' },
  webp: { mime: 'image/webp', uti: 'public.webp' },
} as const;

function tipoDoNome(nome: string) {
  const ext = (nome.split('.').pop() ?? '').toLowerCase() as keyof typeof _MIME;
  return _MIME[ext] ?? { mime: 'application/octet-stream', uti: 'public.data' };
}

/** URL de download do anexo (usada também como source de <Image> com header). */
export function urlAnexo(anexoId: number): string {
  return `${API_URL}/chat/anexos/${anexoId}/download`;
}

/**
 * Baixa o anexo (PDF ou imagem) do backend com o token da sessão e abre a folha
 * de compartilhamento do sistema. O download passa pelo `Authorization` porque a
 * rota `/chat/anexos/:id/download` exige participação na conversa.
 */
export async function baixarEAbrirAnexo(anexoId: number, nomeArquivo: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Sessão necessária para baixar anexos.');

  // Prefixa com o id do anexo: dois arquivos com o mesmo nome_original não
  // colidem no cache, e o nome continua legível na folha de compartilhamento.
  const base = (nomeArquivo || 'anexo').replace(/[^\w.\- ]+/g, '_');
  const destino = new File(Paths.cache, `${anexoId}-${base}`);
  if (destino.exists) destino.delete();

  await File.downloadFileAsync(urlAnexo(anexoId), destino, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (await Sharing.isAvailableAsync()) {
    const t = tipoDoNome(base);
    await Sharing.shareAsync(destino.uri, { mimeType: t.mime, UTI: t.uti, dialogTitle: base });
  }
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
