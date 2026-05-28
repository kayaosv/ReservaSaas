import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

export const BookingCancelledToRestaurant = ({
  restaurantName,
  customerName,
  partySize,
  dateLabel,
  time,
}) => (
  <Html lang="es">
    <Head />
    <Preview>Cancelación — {customerName} ({partySize} pax)</Preview>
    <Body style={body}>
      <Container style={container}>
        <Heading style={h1}>Reserva cancelada</Heading>
        <Text style={p}>Se ha cancelado una reserva en {restaurantName}:</Text>

        <Section style={card}>
          <Text style={cardLabel}>Cliente</Text>
          <Text style={cardValue}>{customerName}</Text>
          <Text style={cardLabel}>Comensales</Text>
          <Text style={cardValue}>{partySize}</Text>
          <Text style={cardLabel}>Fecha</Text>
          <Text style={cardValue}>{dateLabel} · {time}</Text>
        </Section>

        <Text style={p}>Este slot ha quedado libre.</Text>

        <Hr style={hr} />
        <Text style={footer}>RestoBook · Notificación automática</Text>
      </Container>
    </Body>
  </Html>
)

const body = { backgroundColor: "#f9fafb", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", margin: 0, padding: 0 }
const container = { backgroundColor: "#ffffff", maxWidth: 560, margin: "32px auto", padding: 32, borderRadius: 8, border: "1px solid #e5e7eb" }
const h1 = { fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 16px" }
const p = { fontSize: 15, color: "#374151", margin: "8px 0", lineHeight: 1.5 }
const card = { backgroundColor: "#f9fafb", borderRadius: 6, padding: 20, marginTop: 16, border: "1px solid #e5e7eb" }
const cardLabel = { fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, margin: "8px 0 2px" }
const cardValue = { fontSize: 16, color: "#111827", fontWeight: 600, margin: 0 }
const hr = { borderColor: "#e5e7eb", margin: "24px 0" }
const footer = { fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }
