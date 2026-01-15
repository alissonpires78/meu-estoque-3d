function loadDefaultData() {
  loadFilamentosFromSource()
    .then(data => {
      filaments = data.map(f => ({
        ...f,
        localizacao: f.localizacao || 'Prateleira A1',
        foto: null,
        fotoBlob: f.fotoBlob || null
      }));
      saveData();
      render();
    })
    .catch((err) => {
      console.error(err);
      filaments = [];
    });
}
