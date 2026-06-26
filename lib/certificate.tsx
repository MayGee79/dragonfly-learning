import React from 'react'
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { formatDate } from './format'

const BANNER = '#b9d5d6'
const NAVY = '#2d3758'

export type CertificateData = {
  attendeeName: string
  courseTitle: string
  cpdHours: string | number
  completedAt: Date | string | null
  certificateReference: string
  professionalRegistration?: string | null
  issuedAt: Date
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 56,
    fontSize: 11,
    color: NAVY,
    fontFamily: 'Helvetica',
  },
  orgLine: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  brand: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BANNER,
    textAlign: 'center',
    marginTop: 8,
  },
  heading: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  certifyLine: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 28,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: BANNER,
    textAlign: 'center',
    marginTop: 12,
  },
  completedLine: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginTop: 28,
  },
  metaBlock: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  registration: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
  },
  certRef: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 8,
    color: '#64748b',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginTop: 28,
    marginBottom: 12,
  },
  signatureName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  signatureOrg: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  issueDate: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 8,
    color: '#64748b',
  },
  membership: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 16,
    color: '#64748b',
  },
  disclaimer: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
})

export function formatCertificateReference(completionId: string): string {
  return `CERT-${completionId.replace(/-/g, '').slice(0, 12).toUpperCase()}`
}

function CertificateDocument({ data }: { data: CertificateData }) {
  const cpd = typeof data.cpdHours === 'number' ? data.cpdHours.toFixed(1) : data.cpdHours

  return (
    <Document
      title={`Certificate of Completion: ${data.courseTitle}`}
      author="Dragonfly Learning"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.orgLine}>Dragonfly Psychotherapy</Text>
        <Text style={styles.brand}>Dragonfly Learning</Text>
        <Text style={styles.heading}>Certificate of Completion</Text>
        <Text style={styles.subtitle}>Continuing Professional Development</Text>

        <Text style={styles.certifyLine}>This is to certify that</Text>
        <Text style={styles.name}>{data.attendeeName}</Text>
        <Text style={styles.completedLine}>has successfully completed the on-demand CPD session</Text>
        <Text style={styles.courseTitle}>{data.courseTitle}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>CPD Hours:</Text>
            <Text style={styles.metaValue}>{cpd}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Date of completion:</Text>
            <Text style={styles.metaValue}>{formatDate(data.completedAt) || '-'}</Text>
          </View>
        </View>

        {data.professionalRegistration ? (
          <Text style={styles.registration}>
            Professional registration number (where applicable): {data.professionalRegistration}
          </Text>
        ) : null}

        <Text style={styles.certRef}>Certificate reference: {data.certificateReference}</Text>

        <View style={styles.divider} />
        <Text style={styles.signatureName}>Dr Victoria Froome</Text>
        <Text style={styles.signatureOrg}>Dragonfly Psychotherapy</Text>
        <Text style={styles.issueDate}>Date of issue: {formatDate(data.issuedAt)}</Text>

        <Text style={styles.membership}>
          Dr Victoria Froome MBACP · Registered Member of the British Association for Counselling and
          Psychotherapy (402603)
        </Text>

        <Text style={styles.disclaimer}>
          CPD hours are indicative. Please confirm suitability with your own professional body or employer.
        </Text>
      </Page>
    </Document>
  )
}

export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument data={data} />)
}
