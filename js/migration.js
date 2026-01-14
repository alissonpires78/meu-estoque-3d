/**
 * Script utilitário para migrar dados do LocalStorage para o Supabase.
 * Para usar: Cole este código no console do navegador após configurar o Supabase.
 */
async function migrateToSupabase() {
    const localFilaments = JSON.parse(localStorage.getItem('filaments') || '[]');
    const localPrinters = JSON.parse(localStorage.getItem('printers') || '[]');
    const localHistory = JSON.parse(localStorage.getItem('usageHistory') || '[]');

    console.log('Iniciando migração...');

    if (localFilaments.length > 0) {
        const { error } = await supabaseClient.from('filaments').insert(localFilaments);
        if (error) console.error('Erro filamentos:', error);
        else console.log('Filamentos migrados!');
    }

    if (localPrinters.length > 0) {
        const { error } = await supabaseClient.from('printers').insert(localPrinters);
        if (error) console.error('Erro impressoras:', error);
        else console.log('Impressoras migradas!');
    }

    if (localHistory.length > 0) {
        const { error } = await supabaseClient.from('usage_history').insert(localHistory);
        if (error) console.error('Erro histórico:', error);
        else console.log('Histórico migrado!');
    }

    console.log('Migração concluída!');
}
