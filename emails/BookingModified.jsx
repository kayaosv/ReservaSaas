import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

export const BookingModified = ({
  customerName,
  restaurantName,
  restaurantAddress,
  restaurantPhone,
  oldDateLabel,
  oldTime,
  oldPartySize,
  newDateLabel,
  newTime,
  newPartySize,
}) => (
  <Html lang="es">
    <Head />
    <Preview>Tu reserva en {restaurantName} ha sido modificada</Preview>
    <Body style={body}>
      <Container style={container}>
        <Heading style={h1}>{restaurantName}</Heading>
        <Text style={p}>Hola {customerName},</Text>
        <Text style={p}>Tu reserva ha sido actualizada. Aquí tienes los detalles:</Text>

        <Section style={card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={th}>Antes</th>
                <th style={th}>Ahora</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdLabel}>Fecha</td>
                <td style={tdOld}>{oldDateLabel}</td>
                <td style={tdNew}>{newDateLabel}</td>
              </tr>
              <tr>
                <td style={tdLabel}>Hora</td>
                <td style={tdOld}>{oldTime}</td>
                <td style={tdNew}>{newTime}</td>
              </tr>
              <tr>
                <td style={tdLabel}>Comensales</td>
                <td style={tdOld}>{oldPartySize}</td>
                <td style={tdNew}>{newPartySize}</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Text style={pSmall}>
          Si no solicitaste este cambio, contacta con el restaurante
          {restaurantPhone ? ` al ${restaurantPhone}` : ""}.
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          {restaurantName}
          {restaurantAddress ? ` · ${restaurantAddress}` : ""}
          {restaurantPhone ? ` · ${restaurantPhone}` : ""}
        </Text>
      </Container>
    </Body>
  </Html>
)

const body = { backgroundColor: "#f9fafb", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", margin: 0, padding: 0 }
const container = { backgroundColor: "#ffffff", maxWidth: 560, margin: "32px auto", padding: 32, borderRadius: 8, border: "1px solid #e5e7eb" }
const h1 = { fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 16px" }
const p = { fontSize: 15, color: "#374151", margin: "8px 0", lineHeight: 1.5 }
const pSmall = { fontSize: 13, color: "#6b7280", margin: "16px 0 0", lineHeight: 1.5 }
const card = { backgroundColor: "#f9fafb", borderRadius: 6, padding: 16, marginTop: 16, border: "1px solid #e5e7eb" }
const th = { fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }
const tdLabel = { fontSize: 13, color: "#374151", padding: "8px", fontWeight: 600 }
const tdOld = { fontSize: 13, color: "#9ca3af", padding: "8px", textDecoration: "line-through" }
const tdNew = { fontSize: 14, color: "#111827", padding: "8px", fontWeight: 600 }
const hr = { borderColor: "#e5e7eb", margin: "24px 0" }
const footer = { fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }
