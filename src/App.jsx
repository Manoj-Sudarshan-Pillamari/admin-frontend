import { useState } from "react";
import { Container, Box, Tabs, Tab, Typography } from "@mui/material";
import PremiumBrands from "./PremiumBrands";
import PopularBrands from "./PopularBrands";
import VideoPlayer from "./VideoPlayer";

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

function App() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Brands Admin UI
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            "& .MuiTab-root": {
              fontWeight: "bold",
              fontSize: "1rem",
              textTransform: "none",
            },
          }}
        >
          <Tab label="Premium Brands" />
          <Tab label="Popular Brands" />
          <Tab label="Video Player" />
        </Tabs>
      </Box>
      <TabPanel value={activeTab} index={0}>
        <PremiumBrands />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <PopularBrands />
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        <VideoPlayer />
      </TabPanel>
    </Container>
  );
}

export default App;
