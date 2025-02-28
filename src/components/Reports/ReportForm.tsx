import React, { useState } from "react";
import { Input, Select, SelectItem, IndexPath, useTheme } from "@ui-kitten/components";
import { View, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import RNPickerSelect from "react-native-picker-select";
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
  const [selectedTypeIndex, setSelectedTypeIndex] = React.useState(new IndexPath(0));
  const theme = useTheme();
  const [selectedValue, setSelectedValue] = useState(null);
  const items = [
    { label: "Roca Sedimentaria", value: "sedimentary" },
    { label: "Roca Ígnea", value: "igneous" },
    { label: "Roca Metamórfica", value: "metamorphic" },
    { label: "Libre", value: "free" },
  ];
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
      onValueChange={(value) => setSelectedValue(value)}
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