<template>
  <div id="app">
    <Navbar v-if="$route.path !== '/login'" /> 
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import Navbar from './components/navbar.vue'; // Sesuaikan path

export default {
  components: {
    Navbar,
  },
  // ... logic lainnya
};
</script>

<style>
/* 1. GLOBAL CSS RESET */
html, body {
    margin: 0;
    padding: 0;
    /* Ini adalah kunci untuk menghilangkan spasi tepi bawaan browser */
}

/* 2. BOX-SIZING HACK (Best Practice) */
*, *::before, *::after {
    box-sizing: border-box;
    /* Memastikan padding dan border dihitung di dalam lebar/tinggi elemen, 
       bukan menambahnya. Ini membantu layout Anda tetap akurat. */
}

/* 3. BASIC GLOBAL STYLES */
#app {
    /* Opsional: Terapkan font dasar jika Anda punya */
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
}

/* 4. MAIN CONTENT SPACING (Disesuaikan untuk Navbar) */
.main-content {
    /* Beri padding atas yang cukup agar konten tidak tertutup Navbar */
    /* Karena Navbar Anda memiliki tinggi 60px, padding 70-80px umumnya aman */
    padding: 75px 20px 20px 20px; 
    /* Tambahkan padding horizontal (kiri-kanan) 20px agar konten tidak mepet tepi */
    
    /* Atur lebar maksimum untuk konsistensi dengan konten lain */
    max-width: 1200px;
    margin: 0 auto; 
}

/* Penyesuaian padding mobile jika perlu */
@media (max-width: 768px) {
    .main-content {
        /* Kurangi padding horizontal di mobile agar konten lebih lebar */
        padding-left: 10px;
        padding-right: 10px;
    }
}
</style>