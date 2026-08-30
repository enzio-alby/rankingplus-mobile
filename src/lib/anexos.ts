import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_URL } from '@/config';
import { getToken } from '@/api/client';

/**
 * Baixa o anexo (PDF) do backend com o token da sessão e abre a folha de
 * compartilhamento do sistema. O download tem que passar pelo `Authorization`
 * porque a rota `/chat/anexos/:id/download` exige participação na conversa.
 */
export async function baixarEAbrirAnexo(anexoId: number, nomeArquivo: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('Sessão necessária para baixar anexos.');

  const nomeSeguro = (nomeArquivo || `anexo-${anexoId}.pdf`).replace(/[^\w.\- ]+/g, '_');
  const destino = new File(Paths.cache, nomeSeguro);
  if (destino.exists) destino.delete();

  await File.downloadFileAsync(`${API_URL}/chat/anexos/${anexoId}/download`, destino, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(destino.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: nomeSeguro,
    });
  }
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
