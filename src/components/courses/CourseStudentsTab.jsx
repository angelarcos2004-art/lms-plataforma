import { useState, useEffect } from 'react'
import { getAlumnosCursoGrading } from '../../lib/coursesService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ConfirmModal from '../ui/ConfirmModal'

const getBase64ImageFromUrl = (imageUrl) => new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || 400
    canvas.height = img.naturalHeight || 300
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    resolve(canvas.toDataURL('image/png'))
  }
  img.onerror = () => reject(new Error('No se pudo cargar imagen'))
  img.src = imageUrl
})

export default function CourseStudentsTab({ cursoId, embedded = false }) {
  const [actas, setActas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await getAlumnosCursoGrading(cursoId)
      if (data) setActas(data)
      setLoading(false)
    }
    load()
  }, [cursoId])

  const ejecutarGenerarPDF = async () => {
    setIsProcessing(true)
    try {
      const aprobados = actas.filter(a => a.calificacion_final >= 60).length
      const reprobados = actas.length - aprobados
      const promedioCurso = actas.length
        ? Math.round(actas.reduce((s, a) => s + a.calificacion_final, 0) / actas.length)
        : 0

      const qcData = {
        type: 'doughnut',
        data: {
          labels: [`Aprobados (${aprobados})`, `Reprobados (${reprobados})`],
          datasets: [{ backgroundColor: ['#16a34a', '#dc2626'], data: [aprobados, reprobados] }]
        },
        options: {
          title: { display: true, text: 'Distribucion Final del Grupo', fontSize: 14 },
          legend: { position: 'bottom' }
        }
      }
      const qcUrl = `https://quickchart.io/chart?w=400&h=300&c=${encodeURIComponent(JSON.stringify(qcData))}`
      let chartBase64 = null
      try { chartBase64 = await getBase64ImageFromUrl(qcUrl) } catch {}

      const doc = new jsPDF()

      doc.setFillColor(159, 18, 57)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setFontSize(15)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text('REPORTE DE CALIFICACIONES DEL GRUPO', 105, 13, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Curso: ${cursoId}   |   Fecha: ${new Date().toLocaleDateString('es-MX')}   |   Promedio del grupo: ${promedioCurso}/100`,
        105, 23, { align: 'center' }
      )

      autoTable(doc, {
        startY: 36,
        headStyles: { fillColor: [159, 18, 57], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [254, 248, 248] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          5: { halign: 'center', fontStyle: 'bold', textColor: [80, 80, 80] },
          6: { halign: 'center', fontStyle: 'bold' }
        },
        head: [['#', 'Nombre', 'Correo', 'Avance', 'Promedio', 'Estatus', 'Nota Final']],
        body: actas.map((a, i) => [
          i + 1,
          a.estudiante?.nombre_completo ?? 'Sin nombre',
          a.estudiante?.email ?? '',
          `${a.porcentaje_avance ?? 0}%`,
          `${a.promedio_tareas ?? 0}`,
          a.calificacion_final >= 60 ? 'APROBADO' : 'REPROBADO',
          `${a.calificacion_final ?? 0} / 100`
        ])
      })

      if (chartBase64) {
        const tableEnd = doc.lastAutoTable?.finalY ?? 36
        const posY = tableEnd + 12 + 65 > 280 ? (() => { doc.addPage(); return 20 })() : tableEnd + 12
        doc.addImage(chartBase64, 'PNG', 55, posY, 100, 65)
      }

      const total = doc.getNumberOfPages()
      for (let p = 1; p <= total; p++) {
        doc.setPage(p)
        doc.setFontSize(8)
        doc.setTextColor(160)
        doc.setFont('helvetica', 'normal')
        doc.text('Generado automaticamente por Paideia LMS', 105, 290, { align: 'center' })
      }

      doc.save(`reporte_grupo_${cursoId}_${Date.now()}.pdf`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerarPDF = () => {
    setConfirmModal({
      title: '¿Generar Reporte del Grupo?',
      description: 'Se generará el PDF con las calificaciones y gráfica del grupo y se descargará en tu equipo.',
      confirmLabel: 'Generar PDF',
      onConfirm: () => {
        setConfirmModal(null)
        ejecutarGenerarPDF()
      }
    })
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando lista de estudiantes...</div>
  if (!actas || actas.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '1rem' }}>No hay estudiantes activos en este curso todavía.</div>

  return (
    <div style={embedded ? {} : { background: 'var(--bg-card)', border: '1px solid var(--wine-100)', borderRadius: '1rem', padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: embedded ? 'flex-end' : 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {!embedded && <div>
          <h2 style={{ margin: '0 0 0.25rem', color: 'var(--wine-800)', fontSize: '1.2rem', fontWeight: 800 }}>Lista y Calificaciones</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Control general del aula</p>
        </div>}
        <button
          onClick={handleGenerarPDF}
          disabled={isProcessing}
          style={{ padding: '0.7rem 1.2rem', background: 'var(--gold)', color: 'var(--wine-900)', border: 'none', borderRadius: '0.5rem', fontWeight: 800, cursor: isProcessing ? 'wait' : 'pointer', transition: 'filter 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
        >
          {isProcessing ? '⚙️ Generando PDF...' : '📜 Generar PDF del Grupo'}
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--wine-100)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--navbar-bg)', color: 'white' }}>
              <th style={{ padding: '1rem' }}>Alumno</th>
              <th style={{ padding: '1rem' }}>Contacto</th>
              <th style={{ padding: '1rem' }}>Progreso</th>
              <th style={{ padding: '1rem' }}>Promedio</th>
              <th style={{ padding: '1rem' }}>Cálculo Final</th>
            </tr>
          </thead>
          <tbody>
            {actas.map((a, i) => (
              <tr key={a.inscripcion_id} style={{ borderBottom: '1px solid var(--wine-100)', background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-page)' }}>
                <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--wine-900)' }}>{a.estudiante.nombre_completo}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{a.estudiante.email}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ width: '100px', height: '6px', background: 'var(--wine-100)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${a.porcentaje_avance}%`, height: '100%', background: a.porcentaje_avance >= 80 ? 'var(--success)' : 'var(--warning)' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{a.porcentaje_avance}%</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.3rem 0.6rem', background: 'var(--wine-50)', borderRadius: '4px', fontWeight: 700, color: 'var(--wine-700)' }}>
                    {a.promedio_tareas}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.3rem 0.6rem',
                    background: a.calificacion_final >= 60 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                    color: a.calificacion_final >= 60 ? 'var(--success)' : 'var(--error)',
                    borderRadius: '4px', fontWeight: 800
                  }}>
                    {a.calificacion_final}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirmModal !== null}
        title={confirmModal?.title ?? ''}
        description={confirmModal?.description}
        confirmLabel={confirmModal?.confirmLabel}
        onConfirm={confirmModal?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  )
}
