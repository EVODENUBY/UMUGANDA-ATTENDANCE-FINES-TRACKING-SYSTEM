import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Language as WebIcon,
  YouTube as YouTubeIcon,
  AccessTime as ClockIcon,
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(90deg, #0f2027 0%, #2c5364 100%)',
        color: 'white',
        py: { xs: 4, md: 6 },
        mt: 'auto',
        boxShadow: '0 0 24px 0 rgba(44,83,100,0.3)',
        borderTopLeftRadius: { xs: 16, md: 32 },
        borderTopRightRadius: { xs: 16, md: 32 },
        fontFamily: 'Montserrat, Roboto, Arial, sans-serif',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            gap: 4,
            alignItems: 'center',
          }}
        >
          {/* Left Section */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 0 } }}>
            <Typography variant="h6" gutterBottom sx={{ letterSpacing: 2, fontWeight: 700, color: 'cyan' }}>
              UATS
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
              UMUGANDA ATTENDANCE AND FINES TRACKING SYSTEM
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <ClockIcon sx={{ color: 'cyan' }} />
              <Typography variant="body2" sx={{ color: 'cyan', fontWeight: 'bold', letterSpacing: 1 }}>
                {currentTime.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>

          {/* Center Section */}
          <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 0 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'cyan' }}>
              Connect With Me
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 2,
                '& .MuiIconButton-root': {
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.15)',
                    bgcolor: 'rgba(0,255,255,0.08)',
                    boxShadow: '0 0 8px 0 cyan',
                  },
                },
              }}
            >
              <IconButton href="https://github.com/EVODENUBY" target="_blank" sx={{ color: 'cyan' }}>
                <GitHubIcon />
              </IconButton>
              <IconButton href="https://url-shortener.me/PLN" target="_blank" sx={{ color: 'cyan' }}>
                <LinkedInIcon />
              </IconButton>
              <IconButton href="https://www.youtube.com/@EVODENUBY" target="_blank" sx={{ color: 'red' }}>
                <YouTubeIcon />
              </IconButton>
              <IconButton href="https://twitter.com/@evodeSTACK" target="_blank" sx={{ color: '#1da1f2' }}>
                <TwitterIcon />
              </IconButton>
              <IconButton href="https://evodenuby.vercel.app" target="_blank" sx={{ color: 'lime' }}>
                <WebIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Right Section */}
          <Box
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'cyan' }}>
              EVODENUBY-FullStack Dev
            </Typography>

            <Typography variant="body2" component="div">
              <Link
                href="mailto:evodenuby@gmail.com"
                sx={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    color: 'cyan',
                    fontWeight: 'bold',
                    transform: 'scale(1.05)',
                    textShadow: '0 0 8px cyan',
                  },
                }}
              >
                evodemuyisingize@gmail.com
              </Link>
            </Typography>

            <Typography variant="body2" component="div">
              <Link
                href="tel:+250791783308"
                sx={{
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    color: 'cyan',
                    fontWeight: 'bold',
                    transform: 'scale(1.05)',
                    textShadow: '0 0 8px cyan',
                  },
                }}
              >
                +250 791 783 308
              </Link>
            </Typography>

            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8, fontWeight: 500 }}>
              © {new Date().getFullYear()} All rights reserved
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
