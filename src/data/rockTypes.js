const RockTypes = {
    sedimentary: [
      { subtype: 'Brecha', image: require('../assets/sedimentary/brecha.png') },
      { subtype: 'Lutita', image: require('../assets/sedimentary/lutita.png') },
      { subtype: 'Caliza', image: require('../assets/sedimentary/caliza.png') },
    ],
    metamorphic: [
      { subtype: 'Gneiss', image: require('../assets/metamorphic/gneiss.png') },
      { subtype: 'Gneiss máfico', image: require('../assets/metamorphic/gneiss_mafico.png') },
      { subtype: 'Mármol', image: require('../assets/metamorphic/marmol.png') },
    ],
    igneous: [
      { subtype: 'Toba', image: require('../assets/igneous/toba.png') },
      { subtype: 'Toba-brecha', image: require('../assets/igneous/toba_brecha.png') },
      { subtype: 'Brecha volcánica', image: require('../assets/igneous/brecha_volcanica.png') },
    ],
  };

  export default RockTypes;