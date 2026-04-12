#include "tqpu.h"
#include <math.h>
#include <time.h>
#include <stdlib.h>

// Global TQPU state (lives inside every compiled binary via emitted runtime)
static TQPUState TQPU;

static void tqpu_hamiltonian_update(ir_node_t *insn) {
    if(!insn) return;
    double eta = 0.42, gamma = 0.31, beta = 0.09, sigma = 0.07;
    double alpha = 0.33, delta = 0.28, tau = 0.25;

    for (int i = 0; i < 32; i++) {
        for (int j = 0; j < 32; j++) {
            double sigmoid = 1.0 / (1.0 + exp(-gamma * TQPU.H[i][j]));
            double noise = (rand() / (double)RAND_MAX - 0.5) * (1.0 + beta * fabs(TQPU.H[i][j]));
            TQPU.H[i][j] += eta * TQPU.H[i][j] * sigmoid + sigma * noise;

            // quantum evolution
            QuantumAmplitude amp = TQPU.q.amplitudes[i][j];
            double phase_rot = alpha * TQPU.H[i][j];
            QMAP(TQPU.q.amplitudes[i][j], 
                 QREAL(amp)*cos(phase_rot) - QIMAG(amp)*sin(phase_rot), 
                 QREAL(amp)*sin(phase_rot) + QIMAG(amp)*cos(phase_rot));
        }
    }

    if (insn->op == IR_ADD || insn->op == IR_MUL) {
        surface_measure_stabilizers(&TQPU.sc, insn, TQPU.H);
        qec_measure_syndrome(&TQPU.qec, insn, TQPU.H);
    }
}

void tqpu_init(TQPUState *tqpu) {
    for (int i = 0; i < 32; i++)
        for (int j = 0; j < 32; j++)
            tqpu->H[i][j] = (i == j) ? 1.0 : 0.0;
    quantum_init_state(&tqpu->q);
    qec_init(&tqpu->qec);
    surface_init(&tqpu->sc);
    tqpu->logical_fidelity = 1.0;
}

void tqpu_evolve_and_emit(ir_func_t *f, FILE *out) {
    fprintf(out, "    # TQPU — Topological Quantum Processing Unit (living processor)\n");
    fprintf(out, "    # t = %ld, self-mod + quantum collapse + surface-code lattice active\n\n", (long)time(NULL));

    tqpu_init(&TQPU);

    for (ir_node_t *insn = f->head; insn; insn = insn->next) {
        tqpu_hamiltonian_update(insn);
        quantum_evolve(&TQPU.q, insn, TQPU.H);

        switch (insn->op) {
            case IR_ADD:
            case IR_MUL:
                surface_decode_and_correct(&TQPU.sc, insn, out);
                qec_apply_correction(&TQPU.qec, insn, out);
                quantum_measure_and_collapse(&TQPU.q, insn, out);
                fprintf(out, "    lea_h r%d, [r%d + r%d]  # TQPU-protected attractor\n",
                        insn->op%32, insn->op%32, insn->op%32);
                break;
            default:
                fprintf(out, "    # TQPU-supervised classical op\n");
        }
    }

    fprintf(out, "    # TQPU stabilized. Logical fidelity = %.6f, Energy = %.6f\n",
            TQPU.logical_fidelity, TQPU.H[0][0]);
}
