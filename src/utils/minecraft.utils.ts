export const getJavaVersions = async () => {
    const response = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    const data = await response.json();
    
    return data.versions
      .filter((v: any) => v.type === 'release')
      .map((v: any) => ({ label: v.id, value: v.id }));
  };