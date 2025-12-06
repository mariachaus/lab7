import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: "center",
    alignItems: "center"
  },
  modal: {
    backgroundColor: "white",
    width: "95%",
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center',
    color: '#2196F3'
  },
  sliderContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10
  },
  label: {
    fontWeight: '600',
    marginBottom: 5
  },
  rangeInfo: {
    textAlign: 'center',
    marginTop: 5,
    color: '#495057'
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  saveButton: {
    backgroundColor: "#2196F3"
  },
  buttonText: {
    color: "white",
    fontWeight: "600"
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 40
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  errorCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFEEBA',
  },
  errorText: {
    color: '#856404',
    fontSize: 14,
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#28A745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  serverInfo: {
    fontSize: 12,
    color: '#666',
  },
  smallButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sensorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  sensorItem: {
    alignItems: 'center',
    marginBottom: 10,
    width: '30%',
  },
  sensorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  normal: {
    color: '#4CAF50',
  },
  warning: {
    color: '#F44336',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#999',
    fontSize: 14,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  timeRangeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2196F3',
  },
  timeRangeText: {
    color: '#666',
  },
  timeRangeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trendUp: {
    color: '#F44336',
  },
  trendDown: {
    color: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginRight: 15,
  },
  statusInfo: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resetButton: {
    color: '#F44336',
    fontSize: 14,
    marginLeft: -60
  },
  deviceControl: {
    marginBottom: 25,
  },
  deviceLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#333',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  deviceValue: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  ruleItem: {
    marginBottom: 25,
  },
  ruleLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  ruleDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  ruleSlider: {
    width: '100%',
    height: 40,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },




  parameterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  selectorTitle: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    fontWeight: '500',
  },
  parameterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
  },
  parameterButtonActive: {
    backgroundColor: '#2196F3',
  },
  parameterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  parameterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  infoItem: {
    alignItems: 'center',
    marginVertical: 5,
    minWidth: '30%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
});
