import React from "react"
import { StyleSheet } from "react-native"
import { Card, Text } from "@ui-kitten/components"
import Svg, { Circle, Polygon, Text as SvgText, Line } from "react-native-svg"

// Función para calcular la intersección de dos líneas
const calculateIntersection = (line1Start, line1End, line2Start, line2End) => {
  const x1 = line1Start.x
  const y1 = line1Start.y
  const x2 = line1End.x
  const y2 = line1End.y
  const x3 = line2Start.x
  const y3 = line2Start.y
  const x4 = line2End.x
  const y4 = line2End.y

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (denominator === 0) {
    return null // Las líneas son paralelas
  }

  const x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denominator
  const y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denominator

  return { x, y }
}

const StreckeisenDiagram = ({ Q, A, P }) => {
  const width = 300
  const height = 260
  const padding = 20

  // Puntos del triángulo principal
  const trianglePoints = [
    { x: width / 2, y: padding }, // Q (top)
    { x: padding, y: height - padding }, // A (bottom left)
    { x: width - padding, y: height - padding }, // P (bottom right)
  ]

  // Cálculo del punto de intersección basado en los porcentajes
  const total = Q + A + P
  const normalizedQ = (Q / total) * 100
  const normalizedA = (A / total) * 100
  const normalizedP = (P / total) * 100

  // Coordenadas para las líneas siguiendo las reglas específicas:
  // Línea Azul (Cuarzo): PQ -> QA
  const QLineStart = {
    x: trianglePoints[2].x - (trianglePoints[2].x - trianglePoints[0].x) * (normalizedQ / 100), // Punto en plano AP
    y: trianglePoints[2].y - (trianglePoints[2].y - trianglePoints[0].y) * (normalizedQ / 100),
  }
  const QLineEnd = {
    x: trianglePoints[0].x - (trianglePoints[0].x - trianglePoints[1].x) * ((100 - normalizedQ) / 100), // Punto en plano QA
    y: trianglePoints[0].y + (trianglePoints[1].y - trianglePoints[0].y) * ((100 - normalizedQ) / 100),
  }
  
  // Línea Verde (Feldespato): QA -> AP
  const ALineStart = {
    x: trianglePoints[0].x - (trianglePoints[0].x - trianglePoints[1].x) * (normalizedA / 100), // Punto en QA
    y: trianglePoints[0].y + (trianglePoints[1].y - trianglePoints[0].y) * (normalizedA / 100),
  }
  const ALineEnd = {
    x: trianglePoints[1].x + (trianglePoints[2].x - trianglePoints[1].x) * ((100 - normalizedA) / 100), // Punto en PQ
    y: trianglePoints[1].y,
  }
  
  // Línea Roja (Plagioclasa): AP -> PQ
  const PLineStart = {
    x: trianglePoints[1].x + (trianglePoints[2].x - trianglePoints[1].x) * (normalizedP / 100), // Punto en plano PQ
    y: trianglePoints[1].y,
  }
  const PLineEnd = {
    x: trianglePoints[2].x - (trianglePoints[2].x - trianglePoints[0].x) * ((100 - normalizedP) / 100), // Punto en plano AP
    y: trianglePoints[2].y - (trianglePoints[2].y - trianglePoints[0].y) * ((100 - normalizedP) / 100),
  }

  // Calcular la intersección de las líneas azul y verde
  const intersection = calculateIntersection(QLineStart, QLineEnd, ALineStart, ALineEnd)

  // Verificar si el punto de intersección está en la línea roja
  const isOnRedLine = (point) => {
    const slopeRed = (PLineEnd.y - PLineStart.y) / (PLineEnd.x - PLineStart.x)
    const yOnRedLine = PLineStart.y + slopeRed * (point.x - PLineStart.x)
    return Math.abs(yOnRedLine - point.y) < 1 // Tolerancia de 1 píxel
  }

  const x = intersection ? intersection.x : ((normalizedA + 0.5 * normalizedP) / 100) * (width - 2 * padding) + padding
  const y = intersection ? intersection.y : height - padding - (normalizedQ / 100) * (height - 2 * padding)

  // Determinación del tipo de roca
  let rockType = ""
  if (normalizedQ > 90) rockType = "Granitoides ricos en cuarzo"
  else if (normalizedQ > 60 && normalizedA > 20) rockType = "Granito Feld. Alcalinico (0-20)"
  else if (normalizedQ > 40 && normalizedA > 20) rockType = "Sienogranito (5-20) Monzogranito (5-20)"
  else if (normalizedQ > 20 && normalizedA > 20) rockType = "Granodiorita (5-25)"
  else if (normalizedQ > 10 && normalizedA > 10) rockType = "Tonalita (10-40) Trondhjemia (0-10)"
  else if (normalizedQ > 5 && normalizedA > 5) rockType = "Czo-Sienita Feld. Alcal. (0-25)"
  else if (normalizedQ > 5 && normalizedA > 5) rockType = "Czo-Sienita(5-30)"
  else if (normalizedQ > 10 && normalizedA > 10) rockType = "Czo-Monzonita (10-35)"
  else if (normalizedQ > 10 && normalizedA > 10) rockType = "Czo-Monzodiorita (10-35) Czo-Monzogabro (20-50)"
  else if (normalizedQ > 20 && normalizedA > 20) rockType = "Czo-Diorita (20-45) Czo-Gabro(25-65)"
  else rockType = "Roca no clasificada"

  return (
    <Card style={styles.diagramCard}>
      <Text category="h6" style={styles.diagramTitle}>
        Diagrama de Streckeisen
      </Text>
      <Svg width={width} height={height}>
        {/* Triángulo principal */}
        <Polygon
          points={`${trianglePoints[0].x},${trianglePoints[0].y} ${trianglePoints[1].x},${trianglePoints[1].y} ${trianglePoints[2].x},${trianglePoints[2].y}`}
          fill="none"
          stroke="black"
        />

        {/* Líneas de porcentaje en los lados del triángulo */}
        {Array.from({ length: 11 }).map((_, i) => {
          const percent = i * 10

          // Puntos en los lados del triángulo para cada porcentaje
          const QPos = {
            x: trianglePoints[1].x + (trianglePoints[2].x - trianglePoints[1].x) * (percent / 100),
            y: trianglePoints[1].y,
          }
          const APos = {
            x: trianglePoints[0].x - (trianglePoints[0].x - trianglePoints[1].x) * (percent / 100),
            y: trianglePoints[0].y + (trianglePoints[1].y - trianglePoints[0].y) * (percent / 100),
          }
          const PPos = {
            x: trianglePoints[2].x - (trianglePoints[2].x - trianglePoints[0].x) * (percent / 100),
            y: trianglePoints[2].y - (trianglePoints[2].y - trianglePoints[0].y) * (percent / 100),
          }

          // Puntos complementarios (100-percent) para las líneas discontinuas
          const QCompPos = {
            x: trianglePoints[1].x + (trianglePoints[2].x - trianglePoints[1].x) * ((100 - percent) / 100),
            y: trianglePoints[1].y,
          }
          const ACompPos = {
            x: trianglePoints[0].x - (trianglePoints[0].x - trianglePoints[1].x) * ((100 - percent) / 100),
            y: trianglePoints[0].y + (trianglePoints[1].y - trianglePoints[0].y) * ((100 - percent) / 100),
          }
          const PCompPos = {
            x: trianglePoints[2].x - (trianglePoints[2].x - trianglePoints[0].x) * ((100 - percent) / 100),
            y: trianglePoints[2].y - (trianglePoints[2].y - trianglePoints[0].y) * ((100 - percent) / 100),
          }

          return (
            <React.Fragment key={i}>
              {/* Líneas discontinuas corregidas */}
              {/* De QA a AP: Si sale de QA en x%, llega a AP en (100-x)% */}
              <Line x1={APos.x} y1={APos.y} x2={PCompPos.x} y2={PCompPos.y} stroke="gray" strokeDasharray="2,2" />
              {/* De AP a PQ: Si sale de AP en x%, llega a PQ en (100-x)% */}
              <Line x1={PPos.x} y1={PPos.y} x2={QCompPos.x} y2={QCompPos.y} stroke="gray" strokeDasharray="2,2" />
              {/* De PQ a QA: Si sale de PQ en x%, llega a QA en (100-x)% */}
              <Line x1={QPos.x} y1={QPos.y} x2={ACompPos.x} y2={ACompPos.y} stroke="gray" strokeDasharray="2,2" />

              {/* Etiquetas de porcentaje */}
              <SvgText x={QPos.x - 10} y={QPos.y + 15} fill="black" fontSize={10}>
                {percent}%
              </SvgText>
              <SvgText x={APos.x - 20} y={APos.y + 5} fill="black" fontSize={10}>
                {percent}%
              </SvgText>
              <SvgText x={PPos.x + 5} y={PPos.y + 5} fill="black" fontSize={10}>
                {percent}%
              </SvgText>
            </React.Fragment>
          )
        })}

        {/* Líneas principales de Q, A y P */}
        <Line x1={QLineStart.x} y1={QLineStart.y} x2={QLineEnd.x} y2={QLineEnd.y} stroke="blue" strokeWidth="2" />
        <Line x1={ALineStart.x} y1={ALineStart.y} x2={ALineEnd.x} y2={ALineEnd.y} stroke="green" strokeWidth="2" />
        <Line x1={PLineStart.x} y1={PLineStart.y} x2={PLineEnd.x} y2={PLineEnd.y} stroke="red" strokeWidth="2" />

        {/* Punto de intersección */}
        {intersection && <Circle cx={intersection.x} cy={intersection.y} r={5} fill="black" />}

        {/* Etiquetas de Q, A y P */}
        <SvgText x={trianglePoints[0].x - 10} y={trianglePoints[0].y - 10} fill="blue">
          Q: {normalizedQ.toFixed(1)}%
        </SvgText>
        <SvgText x={trianglePoints[1].x - 20} y={trianglePoints[1].y + 20} fill="green">
          A: {normalizedA.toFixed(1)}%
        </SvgText>
        <SvgText x={trianglePoints[2].x + 10} y={trianglePoints[2].y + 20} fill="red">
          P: {normalizedP.toFixed(1)}%
        </SvgText>

        {/* Tipo de roca */}
        <SvgText x={x + 10} y={y + 10} fill="black" fontSize={12}>
          {rockType}
        </SvgText>
      </Svg>
    </Card>
  )
}

const styles = StyleSheet.create({
  diagramCard: {
    marginBottom: 16,
  },
  diagramTitle: {
    marginBottom: 8,
  },
})

export default StreckeisenDiagram