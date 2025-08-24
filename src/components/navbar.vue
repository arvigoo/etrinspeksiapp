<template>
  <nav class="navbar-main">
    <div class="navbar-container">
      <div class="navbar-brand">
        <router-link to="/dashboard">
          <span class="brand-text">ETRINSPEKSI</span>
          <span class="brand-icon"></span>
        </router-link>
      </div>

      <button class="hamburger-menu" @click="isMenuOpen = !isMenuOpen" aria-label="Toggle navigation menu">
        <span class="bar" :class="{ 'open': isMenuOpen }"></span>
        <span class="bar" :class="{ 'open': isMenuOpen }"></span>
        <span class="bar" :class="{ 'open': isMenuOpen }"></span>
      </button>

      <div class="nav-elements" :class="{ 'open': isMenuOpen }">
        <ul class="navbar-links">
          <li>
            <router-link to="/dashboard" active-class="active-link" @click="closeMenu">Dashboard</router-link>
          </li>
          <li>
            <router-link to="/inspeksi" active-class="active-link" @click="closeMenu">Inspeksi Baru</router-link>
          </li>
          <li>
            <router-link to="/report" active-class="active-link" @click="closeMenu">Laporan</router-link>
          </li>
        </ul>

        <button @click="handleLogout" class="logout-button">
          Logout
          <span class="icon">🚪</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth'
// Jika Anda menggunakan Vuex, impor bisa berbeda

export default {
  name: 'AppNavbar',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore(); 
    // Tambahkan state untuk menu
    const isMenuOpen = ref(false); 

    const handleLogout = async () => {
      try {
        await authStore.logout(); 
        router.push('/login');
      } catch (error) {
        console.error('Gagal saat logout:', error);
        alert('Gagal logout. Silakan coba lagi.');
      }
    };
    
    // Fungsi untuk menutup menu setelah tautan diklik (opsional, tapi baik)
    const closeMenu = () => {
        isMenuOpen.value = false;
    }

    return {
      isMenuOpen, // Expose state
      handleLogout,
      closeMenu,
    };
  },
};
</script>

---
<style>

/* Color Palette Consistency */
/* Soft Pink: #F7B8C4 (Accent Light) */
/* Dusty Rose: #E8A2AD (Accent Medium) */
/* Deep Violet/Navy: #3F3A5A (Text/Primary/Background) */

.navbar-main {
  background-color: #3F3A5A; 
  padding: 0 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  position: relative; /* Penting untuk positioning menu mobile */
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

/* --- Brand/Logo --- */
/* ... (Tetap sama) */
.navbar-brand a {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.brand-text {
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin-right: 5px;
}

.brand-icon {
  font-size: 1.3rem;
}

/* --- Navigation Links (Desktop Default) --- */
.nav-elements {
    display: flex; /* Flex container for links and button */
    align-items: center;
    gap: 25px; /* Spasi antar navbar-links dan logout-button */
}

.navbar-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 25px;
}

.navbar-links li a {
  color: #f0f0f0;
  text-decoration: none;
  padding: 5px 0;
  font-weight: 500;
  font-size: 1rem;
  border-bottom: 2px solid transparent;
  transition: border-bottom-color 0.3s, color 0.3s;
}

.navbar-links li a:hover {
  color: #F7B8C4; 
}

/* Active Link Style */
.navbar-links li .active-link {
  color: #F7B8C4; 
  border-bottom-color: #F7B8C4;
}

/* --- Logout Button --- */
/* ... (Tetap sama) */
.logout-button {
  background-color: #E8A2AD; 
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.logout-button:hover {
  background-color: #d1929d;
}

.logout-button .icon {
  font-size: 1rem;
}

/* ---------------------------------------------------- */
/* --- Mobile Responsiveness (The New Hamburger Logic) --- */
/* ---------------------------------------------------- */

/* --- Hamburger Button Styling --- */
.hamburger-menu {
  display: none; /* Sembunyikan secara default di desktop */
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  z-index: 100; /* Pastikan di atas konten lain */
}

.bar {
  display: block;
  width: 25px;
  height: 3px;
  margin: 5px auto;
  background-color: white;
  transition: all 0.3s ease-in-out;
}

/* Animasi X saat menu terbuka */
.bar:nth-child(1).open {
  transform: translateY(8px) rotate(45deg);
}

.bar:nth-child(2).open {
  opacity: 0;
}

.bar:nth-child(3).open {
  transform: translateY(-8px) rotate(-45deg);
}   

@media (max-width: 768px) {
  .navbar-container {
    /* Kembali ke display flex, tapi kali ini sejajar (brand dan hamburger) */
    display: flex; 
    justify-content: space-between;
    align-items: center;
    height: 60px; /* Pertahankan tinggi saat tertutup */
  }

  /* Tampilkan Tombol Hamburger */
  .hamburger-menu {
    display: block; 
  }
  
  /* Sembunyikan Navigasi & Logout secara default */
  .nav-elements {
    display: none; 
    flex-direction: column;
    width: 100%;
    position: absolute;
    top: 60px; /* Di bawah navbar utama */
    left: 0;
    background-color: #3f3a5a; 
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    padding: 20px 0;
    z-index: 99;
  }

  /* Tampilkan Navigasi saat menu terbuka */
  .nav-elements.open {
    display: flex;
  }

  /* Tautan Navigasi Mobile */
  .navbar-links {
    flex-direction: column;
    align-items: center;
    gap: 5px;
    width: 100%;
    margin-bottom: 20px;
  }

  .navbar-links li {
      width: 100%;
      text-align: center;
  }

  .navbar-links li a {
    font-size: 1.1rem;
    padding: 10px 0;
    width: 100%;
    display: block; /* Agar link memenuhi lebar li */
  }

  /* Tombol Logout Mobile */
  .logout-button {
    width: 80%; /* Sedikit lebih kecil dari 90% sebelumnya */
    max-width: 300px;
    margin: 0 auto;
    justify-content: center;
    padding: 10px;
  }
}
</style>