import type React from "react"
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#E4E4E4",
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  table: {
    display: "table" as const,
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row" as const,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
  },
})

interface ScheduleData {
  profiles: {
    first_name: string
    last_name: string
  }
  predicted_shift_start: string
  predicted_shift_end: string
}

interface SalesData {
  prediction_date: string
  predicted_sales: number
  confidence_score: number
  actual_sales?: number
}

const PDFDocument: React.FC<{ scheduleData: ScheduleData[]; salesData: SalesData[] }> = ({
  scheduleData,
  salesData,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Store Manager Report</Text>

        <Text style={styles.subtitle}>Employee Scheduling</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Employee Name</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Shift Start</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Shift End</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Total Hours</Text>
            </View>
          </View>
          {scheduleData.map((shift, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{`${shift.profiles.first_name} ${shift.profiles.last_name}`}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{new Date(shift.predicted_shift_start).toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{new Date(shift.predicted_shift_end).toLocaleString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {(
                    (new Date(shift.predicted_shift_end).getTime() - new Date(shift.predicted_shift_start).getTime()) /
                    3600000
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.subtitle}>Sales Forecasting</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Date</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Predicted Sales</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Confidence Score</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Actual Sales</Text>
            </View>
          </View>
          {salesData.map((sale, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{new Date(sale.prediction_date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>${sale.predicted_sales.toFixed(2)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{(sale.confidence_score * 100).toFixed(2)}%</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>${sale.actual_sales ? sale.actual_sales.toFixed(2) : "N/A"}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.subtitle}>Explanatory Notes</Text>
        <Text>
          1. The Employee Scheduling section shows the predicted shifts for each employee, including start time, end
          time, and total hours.
        </Text>
        <Text>
          2. The Sales Forecasting section displays predicted sales figures along with their confidence scores and
          actual sales (where available).
        </Text>
        <Text>
          3. Confidence scores indicate the level of certainty in the prediction, with higher percentages suggesting
          more reliable forecasts.
        </Text>
        <Text>4. Use this information to optimize staffing levels and prepare for expected sales volumes.</Text>
      </View>
    </Page>
  </Document>
)

export const generatePDF = (scheduleData: ScheduleData[], salesData: SalesData[]) => {
  return (
    <PDFDownloadLink
      document={<PDFDocument scheduleData={scheduleData} salesData={salesData} />}
      fileName="store_manager_report.pdf"
    >
      {({ blob, url, loading, error }) => (loading ? "Loading document..." : "Download PDF")}
    </PDFDownloadLink>
  )
}

