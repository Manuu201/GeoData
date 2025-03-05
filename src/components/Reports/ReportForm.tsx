import React, { useState, useEffect } from "react";
import { Input, useTheme } from "@ui-kitten/components";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import RNPickerSelect from "react-native-picker-select";

/**
 * Props para el componente ReportForm.
 * 
 * @property {string} title - Título del reporte.
 * @property {(title: string) => void} setTitle - Función para actualizar el título del reporte.
 * @property {string} type - Tipo de reporte (por ejemplo, "sedimentary", "igneous", "metamorphic", "free").
 * @property {(type: string) => void} setType - Función para actualizar el tipo de reporte.
 * @property {string[]} dynamicTexts - Etiquetas para los campos dinámicos del formulario.
 * @property {string[]} dynamicTextsValues - Valores de los campos dinámicos del formulario.
 * @property {(values: string[]) => void} setDynamicTextsValues - Función para actualizar los valores de los campos dinámicos.
 * @property {string} text2 - Texto libre del reporte.
 * @property {(text: string) => void} setText2 - Función para actualizar el texto libre.
 */

/**
 * Componente que representa un formulario para crear o editar un reporte.
 * 
 * @param {ReportForm} props - Las propiedades del componente.
 * @returns {JSX.Element} - El componente renderizado.
 */

const ReportForm = ({
  title,
  setTitle,
  type,
  setType,
  dynamicTexts,
  dynamicTextsValues,
  setDynamicTextsValues,
  text2,
  setText2,
}) => {
  const theme = useTheme();
  const [selectedValue, setSelectedValue] = useState(type);

  useEffect(() => {
    setSelectedValue(type);
  }, [type]);

  const items = [
    { label: "Roca Sedimentaria", value: "sedimentary" },
    { label: "Roca Ígnea", value: "igneous" },
    { label: "Roca Metamórfica", value: "metamorphic" },
    { label: "Libre", value: "free" },
  ];

  const handleTypeChange = (value) => {
    setSelectedValue(value);
    setType(value);
  };

  return (
    <View>
      <Input
        label="Título"
        placeholder="Ingrese el título del reporte"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <RNPickerSelect
        onValueChange={handleTypeChange}
        items={items}
        placeholder={{ label: "Seleccione un tipo", value: null }}
        value={selectedValue}
      />
      {dynamicTexts.map((label, index) => (
        <Animated.View key={index} entering={FadeInDown.delay(index * 100)} exiting={FadeOutUp}>
          <Input
            label={label}
            placeholder={`Ingrese ${label.toLowerCase()}`}
            value={dynamicTextsValues[index]}
            onChangeText={(value) => {
              const newValues = [...dynamicTextsValues];
              newValues[index] = value;
              setDynamicTextsValues(newValues);
            }}
            style={styles.input}
          />
        </Animated.View>
      ))}
      <Input
        label="Texto libre"
        placeholder="Escriba su texto aquí"
        value={text2}
        onChangeText={setText2}
        multiline
        textStyle={styles.multilineTextStyle}
        style={[styles.input, styles.largeInput]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  largeInput: {
    minHeight: 100,
  },
  multilineTextStyle: {
    minHeight: 64,
    textAlignVertical: "top",
  },
});

export default ReportForm;