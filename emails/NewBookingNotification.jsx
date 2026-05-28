import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from "@react-email/components"

export const NewBookingNotification = ({
  restaurantName,
  customerName,
  customerEmail,
  customerPhone,
  partySize,
  dateLabel,
  time,
  source,
  notes,
  dashboardUrl,
}) => (
  <Html lang="es">
    <Head />
    <Preview>Nueva reserva — {customerName} ({partySize} pax)</Preview>
    <Body style={body}>
      <Container style={container}>
        <Heading style={h1}>Nueva reserva</Heading>
        <Text style={p}>Has recibido una nueva reserva en {restaurantName}.</Text>

        <Section style={card}>
          <Text style={cardLabel}>Cliente</Text>
          <Text style={cardValue}>{customerName}</Text>
          <Text style={cardLabel}>Email</Text>
          <Text style={cardValue}>{customerEmail}</Text>
          {customerPhone ? (
            <>
              <Text style={cardLabel}>Teléfono</Text>
              <Text style={cardValue}>{customerPhone}</Text>
            </>
          ) : null}
          <Text style={cardLabel}>Fecha</Text>
          <Text style={cardValue}>{dateLabel} · {time}</Text>
          <Text style={cardLabel}>Comensales</Text>
          <Text style={cardValue}>{partySize}</Text>
          <Text style={cardLabel}>Origen</Text>
          <Text style={cardValue}>{source}</Text>
          {notes ? (
            <>
              <Text style={cardLabel}>Notas</Text>
              <Text style={cardValue}>{notes}</Text>
            </>
          ) : null}
        </Section>

        <Section style={{ textAlign: "center", marginTop: 24 }}>
          <Button href={dashboardUrl} style={btnPrimary}>Ver en dashboard</Button>
        </Section>

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
const btnPrimary = { backgroundColor: "#111827", color: "#ffffff", padding: "10px 18px", borderRadius: 6, fontSize: 14, textDecoration: "none", display: "inline-block" }
const hr = { borderColor: "#e5e7eb", margin: "24px 0" }
const footer = { fontSize: 12, color: "#9ca3af", textAlign: "center", margin: 0 }
