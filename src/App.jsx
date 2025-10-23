import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, RefreshCw, Database } from 'lucide-react';

//const AirtableCRM = () => {
 const AirtableCRM = ({ baseId, token }) => {
  const BASE_ID = baseId || 'appHZBQF9hvM4ESF1';
  const TOKEN = token || 'patS19BpxIb9mXnyi.cfca5e985096af92bdc73fc2124cb74ec38990755f14dd79b0e09c5d3d4d1d03';
  //const BASE_ID = 'appHZBQF9hvM4ESF1';
  //const TOKEN = 'patS19BpxIb9mXnyi.cfca5e985096af92bdc73fc2124cb74ec38990755f14dd79b0e09c5d3d4d1d03';
  
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [hoveredFlight, setHoveredFlight] = useState(null);
  const [flightDetails, setFlightDetails] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [flightLabels, setFlightLabels] = useState({});
  const [expandedFlight, setExpandedFlight] = useState(null);
  const [expandedFlightData, setExpandedFlightData] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [expandedBookingData, setExpandedBookingData] = useState(null);
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookingLabels, setBookingLabels] = useState({});
  const [hoveredAirline, setHoveredAirline] = useState(null);
  const [airlineDetails, setAirlineDetails] = useState(null);
  const [airlineLabels, setAirlineLabels] = useState({});
  const [hoveredAirport, setHoveredAirport] = useState(null);
  const [airportDetails, setAirportDetails] = useState(null);
  const [airportLabels, setAirportLabels] = useState({});
  const [hoverCardKey, setHoverCardKey] = useState(0);

  useEffect(() => {
    fetchBaseSchema();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchRecords();
    }
  }, [selectedTable]);

  const fetchBaseSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let allTables = [];
      let offset = null;
      
      do {
        const url = offset 
          ? `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables?offset=${offset}`
          : `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch schema');
        
        const data = await response.json();
        allTables = [...allTables, ...(data.tables || [])];
        offset = data.offset;
      } while (offset);
      
      setTables(allTables);
      if (allTables.length > 0) {
        setSelectedTable(allTables[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    if (!selectedTable) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let allRecords = [];
      let offset = null;
      
      do {
        const url = offset
          ? `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(selectedTable.id)}?offset=${offset}`
          : `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(selectedTable.id)}`;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch records');
        
        const data = await response.json();
        allRecords = [...allRecords, ...(data.records || [])];
        offset = data.offset;
      } while (offset);
      
      setRecords(allRecords);
      
      // Fetch flight numbers for all flight references
      await fetchAllFlightNumbers(allRecords);
      
      // Fetch booking numbers for all booking references
      await fetchAllBookingNumbers(allRecords);
      
      // Fetch airline names for all airline references
      await fetchAllAirlineNames(allRecords);
      
      // Fetch airport codes for all airport references
      await fetchAllAirportCodes(allRecords);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFlightNumbers = async (records) => {
    const flightsTable = tables.find(t => t.name.toLowerCase().includes('flight'));
    if (!flightsTable) return;

    const flightIds = new Set();
    
    // Collect all unique flight IDs from records
    records.forEach(record => {
      Object.entries(record.fields).forEach(([key, value]) => {
        const isFlightField = (key.toLowerCase().includes('flight') && key.toLowerCase().includes('detail')) || 
                             (key.toLowerCase() === 'flights');
        if (isFlightField && Array.isArray(value)) {
          value.forEach(id => flightIds.add(id));
        }
      });
    });

    // Fetch all flight details
    const labels = {};
    for (const flightId of flightIds) {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(flightsTable.id)}/${flightId}`,
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const flightNumberField = Object.keys(data.fields).find(key => 
            key.toLowerCase().replace(/[^a-z]/g, '') === 'flightnumber'
          );
          
          if (flightNumberField && data.fields[flightNumberField]) {
            labels[flightId] = data.fields[flightNumberField];
          }
        }
      } catch (err) {
        console.error('Error fetching flight:', err);
      }
    }

    setFlightLabels(labels);
  };

  const fetchAllBookingNumbers = async (records) => {
    const bookingsTable = tables.find(t => t.name.toLowerCase().includes('booking'));
    if (!bookingsTable) return;

    const bookingIds = new Set();
    
    // Collect all unique booking IDs from records
    records.forEach(record => {
      Object.entries(record.fields).forEach(([key, value]) => {
        if (key.toLowerCase().includes('booking') && Array.isArray(value)) {
          value.forEach(id => bookingIds.add(id));
        }
      });
    });

    // Fetch all booking details
    const labels = {};
    for (const bookingId of bookingIds) {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(bookingsTable.id)}/${bookingId}`,
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const bookingNumberField = Object.keys(data.fields).find(key => 
            key.toLowerCase().includes('booking') && (key.toLowerCase().includes('number') || key.toLowerCase().includes('id') || key.toLowerCase().includes('reference'))
          );
          
          if (bookingNumberField && data.fields[bookingNumberField]) {
            labels[bookingId] = data.fields[bookingNumberField];
          }
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
      }
    }

    setBookingLabels(labels);
  };

  const fetchFlightDetails = async (flightId) => {
    try {
      const flightsTable = tables.find(t => t.name.toLowerCase().includes('flight'));
      if (!flightsTable) return;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(flightsTable.id)}/${flightId}`,
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFlightDetails(data);
        
        // Store the flight number for the label
        const flightNumberField = Object.keys(data.fields).find(key => 
          key.toLowerCase().includes('flight') && key.toLowerCase().includes('number')
        );
        
        if (flightNumberField && data.fields[flightNumberField]) {
          setFlightLabels(prev => ({
            ...prev,
            [flightId]: data.fields[flightNumberField]
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching flight details:', err);
    }
  };

  const getFlightLabel = (flightId) => {
    return flightLabels[flightId] || flightId.substring(0, 8) + '...';
  };

  const handleFlightHover = (flightId, event) => {
    if (!flightId) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top
    });
    
    setHoveredFlight(flightId);
    fetchFlightDetails(flightId);
  };

  const handleFlightLeave = () => {
    setHoveredFlight(null);
    setFlightDetails(null);
  };

  const handleFlightClick = async (flightId) => {
    if (expandedFlight === flightId) {
      // Collapse if already expanded
      setExpandedFlight(null);
      setExpandedFlightData(null);
    } else {
      // Expand and fetch details
      setExpandedFlight(flightId);
      
      try {
        const flightsTable = tables.find(t => t.name.toLowerCase().includes('flight'));
        if (!flightsTable) return;

        const response = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(flightsTable.id)}/${flightId}`,
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setExpandedFlightData(data);
          
          // Fetch related airline and airport data
          const airlineIds = [];
          const airportIds = [];
          
          Object.entries(data.fields).forEach(([key, value]) => {
            if (key.toLowerCase().includes('airline')) {
              if (Array.isArray(value)) {
                airlineIds.push(...value);
              } else if (value) {
                airlineIds.push(value);
              }
            }
            if (key.toLowerCase().includes('airport')) {
              if (Array.isArray(value)) {
                airportIds.push(...value);
              } else if (value) {
                airportIds.push(value);
              }
            }
          });
          
          // Fetch airlines
          for (const airlineId of airlineIds) {
            if (!airlineLabels[airlineId]) {
              const airlinesTable = tables.find(t => t.name.toLowerCase().includes('airline'));
              if (airlinesTable) {
                const res = await fetch(
                  `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(airlinesTable.id)}/${airlineId}`,
                  { headers: { 'Authorization': `Bearer ${TOKEN}` } }
                );
                if (res.ok) {
                  const airlineData = await res.json();
                  const nameField = Object.keys(airlineData.fields).find(k => 
                    k.toLowerCase().includes('name') || k.toLowerCase().includes('airline')
                  );
                  if (nameField) {
                    setAirlineLabels(prev => ({
                      ...prev,
                      [airlineId]: airlineData.fields[nameField]
                    }));
                  }
                }
              }
            }
          }
          
          // Fetch airports
          for (const airportId of airportIds) {
            if (!airportLabels[airportId]) {
              const airportsTable = tables.find(t => t.name.toLowerCase().includes('airport'));
              if (airportsTable) {
                const res = await fetch(
                  `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(airportsTable.id)}/${airportId}`,
                  { headers: { 'Authorization': `Bearer ${TOKEN}` } }
                );
                if (res.ok) {
                  const airportData = await res.json();
                  const codeField = Object.keys(airportData.fields).find(k => 
                    k.toLowerCase().includes('code') || k.toLowerCase().includes('iata')
                  );
                  if (codeField) {
                    setAirportLabels(prev => ({
                      ...prev,
                      [airportId]: airportData.fields[codeField]
                    }));
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching flight details:', err);
      }
    }
  };

  const fetchBookingDetails = async (bookingId) => {
    try {
      const bookingsTable = tables.find(t => t.name.toLowerCase().includes('booking'));
      if (!bookingsTable) return;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(bookingsTable.id)}/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookingDetails(data);
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
    }
  };

  const handleBookingHover = (bookingId, event) => {
    if (!bookingId) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top
    });
    
    setHoveredBooking(bookingId);
    fetchBookingDetails(bookingId);
  };

  const handleBookingLeave = () => {
    setHoveredBooking(null);
    setBookingDetails(null);
  };

  const handleBookingClick = async (bookingId) => {
    if (expandedBooking === bookingId) {
      // Collapse if already expanded
      setExpandedBooking(null);
      setExpandedBookingData(null);
    } else {
      // Expand and fetch details
      setExpandedBooking(bookingId);
      
      try {
        const bookingsTable = tables.find(t => t.name.toLowerCase().includes('booking'));
        if (!bookingsTable) return;

        const response = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(bookingsTable.id)}/${bookingId}`,
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setExpandedBookingData(data);
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
      }
    }
  };

  const getBookingLabel = (bookingId) => {
    return bookingLabels[bookingId] || bookingId.substring(0, 8) + '...';
  };

  const fetchAllAirlineNames = async (records) => {
    const airlinesTable = tables.find(t => t.name.toLowerCase().includes('airline'));
    if (!airlinesTable) return;

    const airlineIds = new Set();
    
    records.forEach(record => {
      Object.entries(record.fields).forEach(([key, value]) => {
        if (key.toLowerCase().includes('airline')) {
          if (Array.isArray(value)) {
            value.forEach(id => airlineIds.add(id));
          } else if (value) {
            airlineIds.add(value);
          }
        }
      });
    });

    const labels = {};
    for (const airlineId of airlineIds) {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(airlinesTable.id)}/${airlineId}`,
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const airlineNameField = Object.keys(data.fields).find(key => 
            key.toLowerCase().includes('name') || key.toLowerCase().includes('airline')
          );
          
          if (airlineNameField && data.fields[airlineNameField]) {
            labels[airlineId] = data.fields[airlineNameField];
          }
        }
      } catch (err) {
        console.error('Error fetching airline:', err);
      }
    }

    setAirlineLabels(labels);
  };

  const fetchAllAirportCodes = async (records) => {
    const airportsTable = tables.find(t => t.name.toLowerCase().includes('airport'));
    if (!airportsTable) return;

    const airportIds = new Set();
    
    records.forEach(record => {
      Object.entries(record.fields).forEach(([key, value]) => {
        if (key.toLowerCase().includes('airport')) {
          if (Array.isArray(value)) {
            value.forEach(id => airportIds.add(id));
          } else if (value) {
            airportIds.add(value);
          }
        }
      });
    });

    const labels = {};
    for (const airportId of airportIds) {
      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(airportsTable.id)}/${airportId}`,
          {
            headers: {
              'Authorization': `Bearer ${TOKEN}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const airportCodeField = Object.keys(data.fields).find(key => 
            key.toLowerCase().includes('code') || key.toLowerCase().includes('iata')
          );
          
          if (airportCodeField && data.fields[airportCodeField]) {
            labels[airportId] = data.fields[airportCodeField];
          }
        }
      } catch (err) {
        console.error('Error fetching airport:', err);
      }
    }

    setAirportLabels(labels);
  };

  const fetchAirlineDetails = async (airlineId) => {
    try {
      const airlinesTable = tables.find(t => t.name.toLowerCase().includes('airline'));
      if (!airlinesTable) return;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(airlinesTable.id)}/${airlineId}`,
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAirlineDetails(data);
      }
    } catch (err) {
      console.error('Error fetching airline details:', err);
    }
  };

  const fetchAirportDetails = async (airportId) => {
    try {
      const airportsTable = tables.find(t => t.name.toLowerCase().includes('airport'));
      if (!airportsTable) return;

      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(airportsTable.id)}/${airportId}`,
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAirportDetails(data);
      }
    } catch (err) {
      console.error('Error fetching airport details:', err);
    }
  };

  const handleAirlineHover = (airlineId, event) => {
    if (!airlineId) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top
    });
    
    setHoveredAirline(airlineId);
    fetchAirlineDetails(airlineId);
  };

  const handleAirlineLeave = () => {
    setHoveredAirline(null);
    setAirlineDetails(null);
  };

  const handleAirportHover = (airportId, event) => {
    if (!airportId) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top
    });
    
    setHoveredAirport(airportId);
    fetchAirportDetails(airportId);
  };

  const handleAirportLeave = () => {
    setHoveredAirport(null);
    setAirportDetails(null);
  };

  const getAirlineLabel = (airlineId) => {
    return airlineLabels[airlineId] || airlineId.substring(0, 8) + '...';
  };

  const getAirportLabel = (airportId) => {
    return airportLabels[airportId] || airportId.substring(0, 8) + '...';
  };

  const createRecord = async () => {
    try {
      setError(null);
      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(selectedTable.id)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields: formData })
        }
      );
      
      if (!response.ok) throw new Error('Failed to create record');
      
      await fetchRecords();
      setShowAddForm(false);
      setFormData({});
    } catch (err) {
      setError(err.message);
    }
  };

  const updateRecord = async () => {
    try {
      setError(null);
      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(selectedTable.id)}/${editingRecord.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields: formData })
        }
      );
      
      if (!response.ok) throw new Error('Failed to update record');
      
      await fetchRecords();
      setEditingRecord(null);
      setFormData({});
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRecord = async (recordId) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      setError(null);
      const response = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(selectedTable.id)}/${recordId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${TOKEN}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete record');
      
      await fetchRecords();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(record.fields).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  });

  const getEditableFields = () => {
    if (!selectedTable) return [];
    return selectedTable.fields.filter(f => 
      !f.type.includes('formula') && 
      !f.type.includes('rollup') &&
      !f.type.includes('count') &&
      !f.type.includes('lookup')
    );
  };

  const openAddForm = () => {
    setFormData({});
    setShowAddForm(true);
  };

  const openEditForm = (record) => {
    setFormData(record.fields);
    setEditingRecord(record);
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingRecord(null);
    setFormData({});
  };

  const handleSubmit = () => {
    if (editingRecord) {
      updateRecord();
    } else {
      createRecord();
    }
  };

  const renderFormField = (field) => {
    if (field.type === 'multilineText') {
      return (
        <textarea
          className="form-control"
          rows="3"
          value={formData[field.name] || ''}
          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
        />
      );
    } else if (field.type === 'checkbox') {
      return (
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={formData[field.name] || false}
            onChange={(e) => setFormData({...formData, [field.name]: e.target.checked})}
          />
        </div>
      );
    } else if (field.type === 'number') {
      return (
        <input
          type="number"
          className="form-control"
          value={formData[field.name] || ''}
          onChange={(e) => setFormData({...formData, [field.name]: parseFloat(e.target.value) || 0})}
        />
      );
    } else {
      return (
        <input
          type="text"
          className="form-control"
          value={formData[field.name] || ''}
          onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
        />
      );
    }
  };

  if (loading && tables.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <RefreshCw className="me-2" style={{animation: 'spin 1s linear infinite'}} />
        <span>Loading your CRM...</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column vh-100">
      <nav className="navbar navbar-light bg-white border-bottom">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-light me-2" 
              onClick={() => setShowSidebar(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <Database className="text-primary me-2" size={32} />
            <span className="navbar-brand mb-0 h1">Airtable CRM</span>
          </div>
          <button onClick={fetchBaseSchema} className="btn btn-light">
            <RefreshCw size={16} className="me-1" />
            Refresh
          </button>
        </div>
      </nav>

      {error && (
        <div className="alert alert-danger alert-dismissible mx-3 mt-3" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="d-flex flex-grow-1 overflow-hidden position-relative">
        {showSidebar && (
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" 
            style={{zIndex: 1040}}
            onClick={() => setShowSidebar(false)}
          ></div>
        )}
        
        <div 
          className={`bg-light border-end position-fixed h-100 ${showSidebar ? '' : 'd-none'}`}
          style={{width: '250px', overflowY: 'auto', zIndex: 1050, top: 0, left: 0}}
        >
          <div className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="text-muted text-uppercase mb-0">Tables</h6>
              <button 
                className="btn btn-sm btn-light" 
                onClick={() => setShowSidebar(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="list-group">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table);
                    setShowSidebar(false);
                  }}
                  className={`list-group-item list-group-item-action ${
                    selectedTable?.id === table.id ? 'active' : ''
                  }`}
                >
                  {table.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-grow-1 d-flex flex-column overflow-hidden">
          {selectedTable && (
            <>
              <div className="bg-white border-bottom p-3">
                <div className="d-flex gap-3">
                  <div className="input-group flex-grow-1" style={{maxWidth: '400px'}}>
                    <span className="input-group-text bg-white">
                      <Search size={20} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search records..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button onClick={openAddForm} className="btn btn-primary">
                    <Plus size={20} className="me-1" />
                    Add Record
                  </button>
                </div>
              </div>

              <div className="flex-grow-1 overflow-auto p-3" style={{backgroundColor: '#f8f9fa'}}>
                {loading ? (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <RefreshCw style={{animation: 'spin 1s linear infinite'}} />
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    No records found
                  </div>
                ) : (
                  <div className="row g-3">
                    {filteredRecords.map(record => (
                      <div key={record.id} className="col-12">
                        <div className="card">
                          <div className="card-body py-2 px-3">
                            <div className="d-flex">
                              <div className="flex-grow-1">
                                <div className="row g-2">
                                  {Object.entries(record.fields).map(([key, value]) => {
                                    // Check if this field links to flights or bookings
                                    const isFlightField = (key.toLowerCase().includes('flight') && key.toLowerCase().includes('detail')) || 
                                                         (key.toLowerCase() === 'flights');
                                    const isBookingField = key.toLowerCase().includes('booking') || 
                                                          key.toLowerCase().includes('flightbooking');
                                    const isAirlineField = key.toLowerCase().includes('airline');
                                    const isAirportField = key.toLowerCase().includes('airport');
                                    
                                    // Handle both arrays and single values
                                    const flightIds = isFlightField ? (Array.isArray(value) ? value : (value ? [value] : [])) : [];
                                    const bookingIds = isBookingField ? (Array.isArray(value) ? value : (value ? [value] : [])) : [];
                                    const airlineIds = isAirlineField ? (Array.isArray(value) ? value : (value ? [value] : [])) : [];
                                    const airportIds = isAirportField ? (Array.isArray(value) ? value : (value ? [value] : [])) : [];
                                    
                                    return (
                                      <div key={key} className="col-md-4 col-lg-3">
                                        <small className="text-muted text-uppercase d-block mb-1" style={{fontSize: '0.7rem'}}>
                                          {key}
                                        </small>
                                        <div className="text-dark" style={{fontSize: '0.875rem'}}>
                                          {isFlightField && flightIds.length > 0 ? (
                                            <div>
                                              <div className="d-flex flex-wrap gap-1 mb-1">
                                                {flightIds.map(flightId => (
                                                  <span
                                                    key={flightId}
                                                    className={`badge ${expandedFlight === flightId ? 'bg-dark' : 'bg-primary'}`}
                                                    style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                                    onClick={() => handleFlightClick(flightId)}
                                                  >
                                                    {getFlightLabel(flightId)} {expandedFlight === flightId ? '▼' : '▶'}
                                                  </span>
                                                ))}
                                              </div>
                                              {expandedFlight && flightIds.includes(expandedFlight) && expandedFlightData && (
                                                <div className="border rounded p-2 bg-light mt-1">
                                                  <h6 className="text-primary mb-2" style={{fontSize: '0.875rem'}}>Flight Details</h6>
                                                  <div className="row g-2">
                                                    {Object.entries(expandedFlightData.fields).map(([fkey, fvalue]) => {
                                                      const isAirline = fkey.toLowerCase().includes('airline');
                                                      const isAirport = fkey.toLowerCase().includes('airport');
                                                      const airlineVals = isAirline ? (Array.isArray(fvalue) ? fvalue : (fvalue ? [fvalue] : [])) : [];
                                                      const airportVals = isAirport ? (Array.isArray(fvalue) ? fvalue : (fvalue ? [fvalue] : [])) : [];
                                                      
                                                      return (
                                                        <div key={fkey} className="col-md-6">
                                                          <small className="text-muted text-uppercase d-block" style={{fontSize: '0.65rem'}}>
                                                            {fkey}
                                                          </small>
                                                          <div className="text-dark" style={{fontSize: '0.8rem'}}>
                                                            {isAirline && airlineVals.length > 0 ? (
                                                              <div className="d-flex flex-wrap gap-1">
                                                                {airlineVals.map(aid => (
                                                                  <span key={aid} className="badge bg-info" style={{fontSize: '0.7rem'}}>
                                                                    {airlineLabels[aid] || 'Loading...'}
                                                                  </span>
                                                                ))}
                                                              </div>
                                                            ) : isAirport && airportVals.length > 0 ? (
                                                              <div className="d-flex flex-wrap gap-1">
                                                                {airportVals.map(aid => (
                                                                  <span key={aid} className="badge bg-warning text-dark" style={{fontSize: '0.7rem'}}>
                                                                    {airportLabels[aid] || 'Loading...'}
                                                                  </span>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              Array.isArray(fvalue) ? fvalue.join(', ') : String(fvalue)
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ) : isBookingField && bookingIds.length > 0 ? (
                                            <div>
                                              <div className="d-flex flex-wrap gap-1 mb-1">
                                                {bookingIds.map(bookingId => (
                                                  <span
                                                    key={bookingId}
                                                    className={`badge ${expandedBooking === bookingId ? 'bg-dark' : 'bg-success'}`}
                                                    style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                                    onClick={() => handleBookingClick(bookingId)}
                                                  >
                                                    {getBookingLabel(bookingId)} {expandedBooking === bookingId ? '▼' : '▶'}
                                                  </span>
                                                ))}
                                              </div>
                                              {expandedBooking && bookingIds.includes(expandedBooking) && expandedBookingData && (
                                                <div className="border rounded p-2 bg-light mt-1">
                                                  <h6 className="text-success mb-2" style={{fontSize: '0.875rem'}}>Booking Details</h6>
                                                  <div className="row g-2">
                                                    {Object.entries(expandedBookingData.fields).map(([bkey, bvalue]) => (
                                                      <div key={bkey} className="col-md-6">
                                                        <small className="text-muted text-uppercase d-block" style={{fontSize: '0.65rem'}}>
                                                          {bkey}
                                                        </small>
                                                        <div className="text-dark" style={{fontSize: '0.8rem'}}>
                                                          {Array.isArray(bvalue) ? bvalue.join(', ') : String(bvalue)}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ) : isAirlineField && airlineIds.length > 0 ? (
                                            <div className="d-flex flex-wrap gap-1">
                                              {airlineIds.map(airlineId => (
                                                <span
                                                  key={airlineId}
                                                  className="badge bg-info"
                                                  style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                                  onMouseEnter={(e) => handleAirlineHover(airlineId, e)}
                                                  onMouseLeave={handleAirlineLeave}
                                                >
                                                  {getAirlineLabel(airlineId)}
                                                </span>
                                              ))}
                                            </div>
                                          ) : isAirportField && airportIds.length > 0 ? (
                                            <div className="d-flex flex-wrap gap-1">
                                              {airportIds.map(airportId => (
                                                <span
                                                  key={airportId}
                                                  className="badge bg-warning text-dark"
                                                  style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                                  onMouseEnter={(e) => handleAirportHover(airportId, e)}
                                                  onMouseLeave={handleAirportLeave}
                                                >
                                                  {getAirportLabel(airportId)}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="d-inline-block text-truncate" style={{maxWidth: '200px'}} title={Array.isArray(value) ? value.join(', ') : String(value)}>
                                              {Array.isArray(value) ? value.join(', ') : String(value)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="d-flex flex-column gap-1 ms-2">
                                <button
                                  onClick={() => openEditForm(record)}
                                  className="btn btn-sm btn-outline-primary p-1"
                                  style={{width: '32px', height: '32px'}}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => deleteRecord(record.id)}
                                  className="btn btn-sm btn-outline-danger p-1"
                                  style={{width: '32px', height: '32px'}}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {(showAddForm || editingRecord) && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingRecord ? 'Edit Record' : 'New Record'}
                </h5>
                <button type="button" className="btn-close" onClick={closeForm}></button>
              </div>
              <div className="modal-body">
                {getEditableFields().map(field => (
                  <div key={field.id} className="mb-3">
                    <label className="form-label fw-semibold">
                      {field.name}
                    </label>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button onClick={closeForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="btn btn-primary">
                  {editingRecord ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {hoveredFlight && flightDetails && (
        <div
          key={hoverCardKey}
          className="position-fixed card shadow-lg"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            zIndex: 2000,
            minWidth: '300px',
            maxWidth: '400px',
            pointerEvents: 'none'
          }}
        >
          <div className="card-body">
            <h6 className="card-title mb-3 text-primary">Flight Details</h6>
            {Object.entries(flightDetails.fields).map(([key, value]) => {
              const isAirlineField = key.toLowerCase().includes('airline');
              const isAirportField = key.toLowerCase().includes('airport');
              
              // Handle both single values and arrays
              let airlineIds = [];
              let airportIds = [];
              
              if (isAirlineField) {
                airlineIds = Array.isArray(value) ? value : (value ? [value] : []);
              }
              if (isAirportField) {
                airportIds = Array.isArray(value) ? value : (value ? [value] : []);
              }
              
              return (
                <div key={key} className="mb-2">
                  <small className="text-muted text-uppercase d-block">
                    {key}
                  </small>
                  <div className="text-dark">
                    {isAirlineField && airlineIds.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {airlineIds.map(airlineId => (
                          <span key={airlineId} className="badge bg-info">
                            {airlineLabels[airlineId] || 'Loading...'}
                          </span>
                        ))}
                      </div>
                    ) : isAirportField && airportIds.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {airportIds.map(airportId => (
                          <span key={airportId} className="badge bg-warning text-dark">
                            {airportLabels[airportId] || 'Loading...'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      Array.isArray(value) ? value.join(', ') : String(value)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {hoveredFlight && flightDetails && (
        <div
          className="position-fixed card shadow-lg"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            zIndex: 2000,
            minWidth: '300px',
            maxWidth: '400px',
            pointerEvents: 'none'
          }}
        >
          <div className="card-body">
            <h6 className="card-title mb-3 text-primary">Flight Details</h6>
            {Object.entries(flightDetails.fields).map(([key, value]) => (
              <div key={key} className="mb-2">
                <small className="text-muted text-uppercase d-block">
                  {key}
                </small>
                <div className="text-dark">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hoveredBooking && bookingDetails && (
        <div
          className="position-fixed card shadow-lg"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            zIndex: 2000,
            minWidth: '300px',
            maxWidth: '400px',
            pointerEvents: 'none'
          }}
        >
          <div className="card-body">
            <h6 className="card-title mb-3 text-success">Booking Details</h6>
            {Object.entries(bookingDetails.fields).map(([key, value]) => (
              <div key={key} className="mb-2">
                <small className="text-muted text-uppercase d-block">
                  {key}
                </small>
                <div className="text-dark">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hoveredAirline && airlineDetails && (
        <div
          className="position-fixed card shadow-lg"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            zIndex: 2000,
            minWidth: '300px',
            maxWidth: '400px',
            pointerEvents: 'none'
          }}
        >
          <div className="card-body">
            <h6 className="card-title mb-3 text-info">Airline Details</h6>
            {Object.entries(airlineDetails.fields).map(([key, value]) => (
              <div key={key} className="mb-2">
                <small className="text-muted text-uppercase d-block">
                  {key}
                </small>
                <div className="text-dark">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hoveredAirport && airportDetails && (
        <div
          className="position-fixed card shadow-lg"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            zIndex: 2000,
            minWidth: '300px',
            maxWidth: '400px',
            pointerEvents: 'none'
          }}
        >
          <div className="card-body">
            <h6 className="card-title mb-3 text-warning">Airport Details</h6>
            {Object.entries(airportDetails.fields).map(([key, value]) => (
              <div key={key} className="mb-2">
                <small className="text-muted text-uppercase d-block">
                  {key}
                </small>
                <div className="text-dark">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AirtableCRM;